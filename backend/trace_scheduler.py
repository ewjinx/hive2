import sys
import os
sys.path.append('.')
from app.db.session import SessionLocal
from app.models.job import Job, JobStatus
from app.models.agent import Agent
import app.credits.engine as credit_engine

db = SessionLocal()
queued_jobs = db.query(Job).filter(Job.status == JobStatus.QUEUED).all()
active_agents = db.query(Agent).filter(Agent.status != "offline").all()

print(f"--- SCHEDULER TRACE ---")
print(f"Active Agents found: {len(active_agents)}")
for job in queued_jobs:
    print(f"\\nEvaluating Job {job.id} (Parent={job.parent_id}) | CPU REQ: {job.cpu_req} | RAM REQ: {job.ram_req} | Cost: {job.cost}")
    
    if job.cost == 0:
        if not credit_engine.check_balance(job.owner, 2.0):
            print("  -> SKIPPED: User has insufficient credits (<2.0).")
            continue
        print("  -> Passed credit check.")
        
    for agent in active_agents:
        avail_cpu = agent.cpu_cores - (agent.current_cpu_usage or 0.0)
        avail_ram = agent.ram_gb - (agent.current_ram_usage or 0.0)
        print(f"  -> Agent {agent.id} | CPU: {agent.cpu_cores} (Avail {avail_cpu}) | RAM: {agent.ram_gb} (Avail {avail_ram}) | Status: {agent.status}")
        
        if (agent.status == "idle" or avail_cpu > 0) and avail_cpu >= job.cpu_req and avail_ram >= job.ram_req:
            print(f"    [MATCH SUCCESS] Agent {agent.id} meets all bounding capacity requirements.")
        else:
            print(f"    [MATCH FAIL] Insufficient boundaries.")
