import time
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.job import Job, JobStatus
from app.models.agent import Agent
from app.credits import engine as credit_engine

def schedule_jobs(db: Session):
    now = datetime.now(timezone.utc)
    cutoff_time = now - timedelta(seconds=15) # Faster 15s failure detection limit
    
    # 1. Failure Recovery (7.4): Mark stale agents as offline
    stale_agents = db.query(Agent).filter(
        Agent.last_heartbeat < cutoff_time,
        Agent.status != "offline"
    ).all()
    
    stale_agent_ids = [a.id for a in stale_agents]
    for stale in stale_agents:
        stale.status = "offline"
        db.add(stale)
        
    # Re-queue dropped jobs from disconnected nodes
    if stale_agent_ids:
        dead_jobs = db.query(Job).filter(Job.status == JobStatus.RUNNING, Job.agent_id.in_(stale_agent_ids)).all()
        for dj in dead_jobs:
            dj.status = JobStatus.QUEUED
            dj.agent_id = None
            db.add(dj)
            
    if stale_agents or stale_agent_ids:
        db.commit()

    # 2. Get truly active agents
    active_agents = db.query(Agent).filter(
        Agent.status != "offline", 
        Agent.last_heartbeat >= cutoff_time
    ).all()
    
    # 3. Smart matching: Sort agents by Worst-Fit to spread array distributions
    active_agents.sort(key=lambda a: (a.cpu_cores - (a.current_cpu_usage or 0.0)) + (a.ram_gb - (a.current_ram_usage or 0.0)), reverse=True)

    # 4. WFQ: Fetch QUEUED jobs and rank them by Time × CreditBalance
    queued_jobs = db.query(Job).filter(Job.status == JobStatus.QUEUED).all()

    def calculate_wfq_weight(job):
        created_at_utc = job.created_at
        if created_at_utc.tzinfo is None: created_at_utc = created_at_utc.replace(tzinfo=timezone.utc)
        wait_time_sec = max(1.0, (now - created_at_utc).total_seconds())
        balance = job.owner.balance if job.owner else 0.0
        return wait_time_sec * (1.0 + (max(0, balance) * 0.05))

    queued_jobs.sort(key=calculate_wfq_weight, reverse=True)

    for job in queued_jobs:
        if job.cost == 0: 
            if not credit_engine.check_balance(job.owner, 2.0):
                continue
            credit_engine.deduct_base_fee(db, job, job.owner)
        
        # 5. Try placing onto an active balanced node
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
            
            # Optimistically increment usage locally so the queue scales subsequent loops
            best_agent.current_cpu_usage += job.cpu_req
            best_agent.current_ram_usage += job.ram_req
            best_agent.status = "busy" 
            
            db.add(job)
            db.add(best_agent)
            db.commit()
