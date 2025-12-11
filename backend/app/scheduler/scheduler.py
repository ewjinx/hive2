import time
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.job import Job, JobStatus
from app.models.agent import Agent
from app.credits import engine as credit_engine

def schedule_jobs(db: Session):
    # Get queued jobs (ordered by created_at for now, WFQ later)
    queued_jobs = db.query(Job).filter(Job.status == JobStatus.QUEUED).order_by(Job.created_at).all()
    
    # Get active agents
    # Logic: check heartbeat < 30s ago
    cutoff_time = datetime.now(timezone.utc) - timedelta(seconds=30)
    
    # 1. Mark stale agents as offline
    # Note: SQLite/Postgres timezone handling can be tricky. Ensure DB stores UTC.
    # Assuming standard setup.
    stale_agents = db.query(Agent).filter(
        Agent.last_heartbeat < cutoff_time,
        Agent.status != "offline"
    ).all()
    
    for stale in stale_agents:
        stale.status = "offline"
        db.add(stale)
    
    if stale_agents:
        db.commit()

    # 2. Get truly active agents
    active_agents = db.query(Agent).filter(
        Agent.status != "offline", 
        Agent.last_heartbeat >= cutoff_time
    ).all()
    
    for job in queued_jobs:
        # Check user balance for base fee if not paid? 
        # Assume base fee deducted on submit or here? Let's do here.
        if job.cost == 0: # Not processed yet
            if not credit_engine.check_balance(job.owner, 2.0): # Base fee
                # Fail job? Log error?
                continue
            credit_engine.deduct_base_fee(db, job, job.owner)
        
        # Find suitable agent
        best_agent = None
        for agent in active_agents:
            # Check capacity
            # This is a snapshot check. ideally we reserve resources.
            if agent.status == "idle" or (agent.cpu_cores - agent.current_cpu_usage >= job.cpu_req):
                 # Simple match
                 best_agent = agent
                 break
        
        if best_agent:
            # Assign
            job.agent_id = best_agent.id
            job.status = JobStatus.RUNNING # Optimistic
            best_agent.status = "busy" # Or increment usage
            
            db.add(job)
            db.add(best_agent)
            db.commit()
            
            # Notify agent? Agent polls.
