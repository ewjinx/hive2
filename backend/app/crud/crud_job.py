from typing import List
from sqlalchemy.orm import Session
from app.models.job import Job, JobLog
from app.schemas.job import JobCreate, JobUpdate, JobLogCreate

def get(db: Session, id: int):
    return db.query(Job).filter(Job.id == id).first()

def get_multi_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(Job).filter(Job.owner_id == owner_id).order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: JobCreate, owner_id: int):
    db_obj = Job(
        owner_id=owner_id,
        cpu_req=obj_in.cpu_req,
        ram_req=obj_in.ram_req,
        build_command=obj_in.build_command,
        run_command=obj_in.run_command,
        status="queued"
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_status(db: Session, *, db_obj: Job, status: str):
    db_obj.status = status
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def create_log(db: Session, *, obj_in: JobLogCreate, job_id: int):
    db_obj = JobLog(
        job_id=job_id,
        content=obj_in.content
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_logs(db: Session, job_id: int):
    return db.query(JobLog).filter(JobLog.job_id == job_id).all()

def get_multi_by_agent(db: Session, agent_id: int, status: str = None):
    query = db.query(Job).filter(Job.agent_id == agent_id)
    if status:
        query = query.filter(Job.status == status)
    return query.all()
