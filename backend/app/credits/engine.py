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

def process_job_payment(db: Session, job: Job, duration_sec: float):
    cost_cpu = duration_sec * job.cpu_req * COST_CPU_PER_SEC
    cost_ram = duration_sec * job.ram_req * COST_RAM_PER_GB_SEC
    
    total_variable_cost = cost_cpu + cost_ram
    
    # User pays variable cost
    user = job.owner
    user.balance -= total_variable_cost
    job.cost += total_variable_cost
    
    tx = Transaction(
        user_id=user.id,
        amount=-total_variable_cost,
        description=f"Resource cost for job {job.id} ({duration_sec:.1f}s)"
    )
    db.add(tx)
    db.add(user)
    
    # Agent Earns (from prompt/comments: CPU 0.02/core/sec, RAM 0.005/GB/sec)
    if job.agent and job.agent.owner_id:
        agent_owner = db.query(User).filter(User.id == job.agent.owner_id).first()
        if agent_owner:
            agent_earn_cpu = duration_sec * job.cpu_req * 0.02
            agent_earn_ram = duration_sec * job.ram_req * 0.005
            agent_total_earn = agent_earn_cpu + agent_earn_ram
            
            agent_owner.balance += agent_total_earn
            earn_tx = Transaction(
                user_id=agent_owner.id,
                amount=agent_total_earn,
                description=f"Resource earnings for running job {job.id} on agent '{job.agent.name}'"
            )
            db.add(agent_owner)
            db.add(earn_tx)
            
            # Bonus / Penalty
            if job.status == "success":
                agent_owner.balance += SUCCESS_BONUS
                bonus_tx = Transaction(
                    user_id=agent_owner.id,
                    amount=SUCCESS_BONUS,
                    description=f"Success bonus for completing job {job.id}"
                )
                db.add(bonus_tx)
            elif job.status in ["system_error", "abandoned"]:
                agent_owner.balance -= FAILURE_PENALTY
                penalty_tx = Transaction(
                    user_id=agent_owner.id,
                    amount=-FAILURE_PENALTY,
                    description=f"Infrastructure failure penalty for job {job.id}"
                )
                db.add(penalty_tx)
                
    db.add(job)
    
    # Low balance check
    if user.balance < 5.0 and not user.low_balance_alert_sent:
        from app.core.utils import send_low_balance_email
        send_low_balance_email(user)
        user.low_balance_alert_sent = True
        db.add(user)
        
    db.commit()
