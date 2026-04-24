import time
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.job import Job, JobStatus
from app.models.agent import Agent
from app.credits import engine as credit_engine

def schedule_jobs(db: Session):
    now = datetime.now(timezone.utc)                    #checking for stale agents
    cutoff_time = now - timedelta(seconds=15) 
    
    
    stale_agents = db.query(Agent).filter(
        Agent.last_heartbeat < cutoff_time,
        Agent.status != "offline"
    ).all()
    
    stale_agent_ids = [a.id for a in stale_agents]        #marking stale agents as offline
    for stale in stale_agents:
        stale.status = "offline"
        db.add(stale)
        
    
    if stale_agent_ids:                                 #requeuing dropped jobs from offline nodes
        dead_jobs = db.query(Job).filter(Job.status == JobStatus.RUNNING, Job.agent_id.in_(stale_agent_ids)).all()
        for dj in dead_jobs:
            dj.status = JobStatus.QUEUED
            dj.agent_id = None
            db.add(dj)
            
    if stale_agents or stale_agent_ids:
        db.commit()

#---------------- GRID CLEAN HERE ------------------------



    #grab available agents
    
    active_agents = db.query(Agent).filter(     
        Agent.status != "offline", 
        Agent.last_heartbeat >= cutoff_time
    ).all()
    
    #sort agents by available resources (descending)
    
    active_agents.sort(key=lambda a: (a.cpu_cores - (a.current_cpu_usage or 0.0)) + (a.ram_gb - (a.current_ram_usage or 0.0)), reverse=True)

    
    queued_jobs = db.query(Job).filter(Job.status == JobStatus.QUEUED).all()


    

    def calculate_wfq_weight(job):
        created_at_utc = job.created_at
        if created_at_utc.tzinfo is None: created_at_utc = created_at_utc.replace(tzinfo=timezone.utc)
        wait_time_sec = max(1.0, (now - created_at_utc).total_seconds())
        balance = job.owner.balance if job.owner else 0.0
        return wait_time_sec * (1.0 + (max(0, balance) * 0.05))

    queued_jobs.sort(key=calculate_wfq_weight, reverse=True)

    #assign jobs to agents and deduct base fee from user
    #if user submitting the job has no credits, skip job
    for job in queued_jobs:
        if job.cost == 0: 
            if not credit_engine.check_balance(job.owner, 2.0):
                continue
            credit_engine.deduct_base_fee(db, job, job.owner)
        
       #find best agent for job

        best_agent = None
        for agent in active_agents:
            avail_cpu = agent.cpu_cores - (agent.current_cpu_usage or 0.0)
            avail_ram = agent.ram_gb - (agent.current_ram_usage or 0.0)
            if (agent.status == "idle" or avail_cpu > 0) and avail_cpu >= job.cpu_req and avail_ram >= job.ram_req:
                 best_agent = agent
                 break
        
        if best_agent:
            job.agent_id = best_agent.id
            job.status = JobStatus.RUNNING 
            job.started_at = datetime.now(timezone.utc)
            
            
            best_agent.current_cpu_usage += job.cpu_req
            best_agent.current_ram_usage += job.ram_req
            best_agent.status = "busy" 
            
            db.add(job)
            db.add(best_agent)
            db.commit()
