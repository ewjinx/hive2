from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate, AgentHeartbeat

def get(db: Session, id: int):
    return db.query(Agent).filter(Agent.id == id).first()

def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Agent).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: AgentCreate, owner_id: int = None):
    db_obj = Agent(
        name=obj_in.name,
        cpu_cores=obj_in.cpu_cores,
        ram_gb=obj_in.ram_gb,
        owner_id=owner_id,
        status="idle",
        last_heartbeat=datetime.utcnow()
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_heartbeat(db: Session, *, db_obj: Agent, obj_in: AgentHeartbeat):
    db_obj.last_heartbeat = datetime.utcnow()
    db_obj.current_cpu_usage = obj_in.current_cpu_usage
    db_obj.current_ram_usage = obj_in.current_ram_usage
    db_obj.status = obj_in.status
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_active_agents(db: Session):
    # Logic to find agents with recent heartbeats could go here
    return db.query(Agent).all() 
