from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.job import Job, JobLog, PipelineStep
from app.schemas.job import JobCreate, JobUpdate, JobLogCreate, PipelineStepCreate, PipelineStepUpdate

def get(db: Session, id: int):
    job = db.query(Job).filter(Job.id == id).first()
    if job and job.array_size > 1:
        children = db.query(Job).filter(Job.parent_id == job.id).all()
        if children:
            statuses = [c.status for c in children]
            if all(s == "success" for s in statuses): job.status = "success"
            elif any(s == "failed" for s in statuses): job.status = "failed"
            elif any(s == "running" for s in statuses): job.status = "running"
            elif all(s == "queued" for s in statuses): job.status = "queued"
            else: job.status = "running"
    return job

def get_multi_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    jobs = db.query(Job).filter(Job.owner_id == owner_id, Job.parent_id == None).order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    for job in jobs:
        if job.array_size > 1:
            children = db.query(Job).filter(Job.parent_id == job.id).all()
            if children:
                statuses = [c.status for c in children]
                if all(s == "success" for s in statuses): job.status = "success"
                elif any(s == "failed" for s in statuses): job.status = "failed"
                elif any(s == "running" for s in statuses): job.status = "running"
                elif all(s == "queued" for s in statuses): job.status = "queued"
                else: job.status = "running"
    return jobs

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

    # Create pipeline steps if provided
    if obj_in.steps:
        for index, step in enumerate(obj_in.steps):
            step_obj = PipelineStep(
                job_id=db_obj.id,
                step_index=index,
                name=step.name,
                command=step.command,
                status="pending"
            )
            db.add(step_obj)
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

# --- Pipeline Step Operations ---

def get_pipeline_steps(db: Session, job_id: int) -> List[PipelineStep]:
    return db.query(PipelineStep).filter(
        PipelineStep.job_id == job_id
    ).order_by(PipelineStep.step_index).all()

def get_pipeline_step_by_index(db: Session, job_id: int, step_index: int) -> Optional[PipelineStep]:
    return db.query(PipelineStep).filter(
        PipelineStep.job_id == job_id,
        PipelineStep.step_index == step_index
    ).first()

def update_pipeline_step(db: Session, *, db_obj: PipelineStep, obj_in: PipelineStepUpdate) -> PipelineStep:
    if obj_in.status is not None:
        db_obj.status = obj_in.status
    if obj_in.started_at is not None:
        db_obj.started_at = obj_in.started_at
    if obj_in.finished_at is not None:
        db_obj.finished_at = obj_in.finished_at
    if obj_in.log is not None:
        db_obj.log = obj_in.log
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
