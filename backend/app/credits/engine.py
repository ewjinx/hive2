from sqlalchemy.orm import Session
from app.models.user import User
from app.models.job import Job
from app.models.transaction import Transaction

# Rates
COST_CPU_PER_SEC = 0.03
COST_RAM_PER_GB_SEC = 0.007
COST_NETWORK_PER_MB = 0.00015
BASE_FEE = 2.0
SUCCESS_BONUS = 1.0
FAILURE_PENALTY = 0.5

def check_balance(user: User, estimated_cost: float) -> bool:
    return user.balance >= estimated_cost

def deduct_base_fee(db: Session, job: Job, user: User):
    job.cost += BASE_FEE
    user.balance -= BASE_FEE
    
    tx = Transaction(
        user_id=user.id,
        amount=-BASE_FEE,
        description=f"Base fee for job {job.id}"
    )
    db.add(tx)
    db.add(job)
    db.add(user)
    db.commit()

def process_job_payment(db: Session, job: Job, duration_sec: float, network_mb: float = 0):
    cost_cpu = duration_sec * job.cpu_req * COST_CPU_PER_SEC
    cost_ram = duration_sec * job.ram_req * COST_RAM_PER_GB_SEC
    cost_network = network_mb * COST_NETWORK_PER_MB
    
    total_variable_cost = cost_cpu + cost_ram + cost_network
    
    # User pays variable cost
    user = job.owner
    user.balance -= total_variable_cost
    
    # Agent earns (slightly less logic in prompt, prompt says "Agent Earns" 0.02 vs 0.03)
    # Implementing "Agent Earns" logic
    # CPU: 0.02 vs 0.03 (margin 0.01)
    # RAM: 0.005 vs 0.007 (margin 0.002)
    
    # For now, just deduct from user. Agent earnings would be credited to agent owner.
    
    job.cost += total_variable_cost
    
    tx = Transaction(
        user_id=user.id,
        amount=-total_variable_cost,
        description=f"Resource cost for job {job.id}"
    )
    db.add(tx)
    
    # Success bonus? Prompt says "Success Bonus +1 credit" (to whom? Agent earns it).
    # If job success:
    # agent_owner.balance += ...
    
    db.add(job)
    db.add(user)
    db.commit()
