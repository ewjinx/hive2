from typing import Any, List
import os
import json
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=schemas.Job)
def create_job(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    run_command: str = Form(None),
    build_command: str = Form(None),
    cpu_req: int = Form(1),
    ram_req: float = Form(1.0),
    steps: str = Form(None),  # JSON string of pipeline steps
    array_size: int = Form(1),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit a new job (upload zip).
    Provide either run_command (simple job) or steps (pipeline job).
    steps should be a JSON array: [{"name": "Install", "command": "pip install -r requirements.txt"}, ...]
    """
    # Parse pipeline steps from JSON string
    parsed_steps = None
    if steps:
        try:
            steps_data = json.loads(steps)
            parsed_steps = [schemas.PipelineStepCreate(**s) for s in steps_data]
        except (json.JSONDecodeError, Exception) as e:
            raise HTTPException(status_code=400, detail=f"Invalid steps format: {e}")

    # Validate: need either run_command or steps
    if not run_command and not parsed_steps:
        raise HTTPException(status_code=400, detail="Either run_command or steps must be provided")

    job_in = schemas.JobCreate(
        run_command=run_command,
        build_command=build_command,
        cpu_req=cpu_req,
        ram_req=ram_req,
        steps=parsed_steps,
        array_size=array_size,
    )
    job = crud.crud_job.create(db, obj_in=job_in, owner_id=current_user.id)
    
    # Save file
    file_location = f"{UPLOAD_DIR}/{job.id}.zip"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    if array_size > 1:
        for i in range(1, array_size + 1):
            child_in = schemas.JobCreate(
                run_command=run_command,
                build_command=build_command,
                cpu_req=cpu_req,
                ram_req=ram_req,
                steps=parsed_steps,
                array_size=1,
                env_vars={"HIVE_ARRAY_INDEX": str(i)}
            )
            child_job = crud.crud_job.create(db, obj_in=child_in, owner_id=current_user.id)
            child_job.parent_id = job.id
            child_job.env_vars = {"HIVE_ARRAY_INDEX": str(i)}
            db.add(child_job)
            
        job.status = "queued" # Parent acts globally as a live container
        db.add(job)
        db.commit()
        
    return job

from fastapi import Header

@router.get("", response_model=List[schemas.Job])
def read_jobs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    agent_id: int = None,
    status: str = None,
    current_user: User = Depends(deps.get_current_user_optional),
    x_agent_token: str = Header(None, alias="X-Agent-Token")
) -> Any:
    """
    Retrieve jobs. Dual-auth: Agents fetch tasks via token, Users view dashboard via JWT.
    """
    if x_agent_token:
        from app.models.agent import Agent
        agent = db.query(Agent).filter(Agent.token == x_agent_token).first()
        if not agent:
            raise HTTPException(status_code=401, detail="Invalid agent token")
        if agent_id and agent.id != agent_id:
            raise HTTPException(status_code=403, detail="Token mismatch with requested agent_id")
        return crud.crud_job.get_multi_by_agent(db, agent_id=agent.id, status=status)
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    return crud.crud_job.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)

@router.get("/{job_id}", response_model=schemas.Job)
def read_job(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get job details (includes pipeline_steps).
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not current_user.is_superuser and job.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return job

@router.get("/{job_id}/logs", response_model=List[schemas.JobLog])
def read_job_logs(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get job logs.
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not current_user.is_superuser and job.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return crud.crud_job.get_logs(db, job_id=job_id)

@router.get("/{job_id}/download")
def download_job_file(
    job_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_optional),
    x_agent_token: str = Header(None, alias="X-Agent-Token")
):
    """
    Download job zip file. Dual-auth: Agents or Users.
    """
    is_agent = False
    if x_agent_token:
        from app.models.agent import Agent
        agent = db.query(Agent).filter(Agent.token == x_agent_token).first()
        if not agent:
            raise HTTPException(status_code=401, detail="Invalid agent token")
        is_agent = True
    elif not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if not is_agent and not current_user.is_superuser and job.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    actual_zip_id = job.parent_id if job.parent_id else job.id
    file_path = f"uploads/{actual_zip_id}.zip"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path, media_type='application/zip', filename=f"{actual_zip_id}.zip")

@router.put("/{job_id}", response_model=schemas.Job)
def update_job(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    job_in: schemas.JobUpdate,
    current_agent = Depends(deps.get_current_agent),
):
    """
    Update job status/results. Restricted to authenticated hardware agents.
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = crud.crud_job.update_status(db, db_obj=job, status=job_in.status) 

    if job_in.finished_at:
        job.finished_at = job_in.finished_at
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Process payment and release locks if job reaches a terminal state
    terminal_states = ["success", "failed", "system_error", "abandoned"]
    if job.status in terminal_states:
        if job.agent_id:
            from app.models.agent import Agent
            agent = db.query(Agent).filter(Agent.id == job.agent_id).first()
            if agent:
                agent.current_cpu_usage = max(0.0, (agent.current_cpu_usage or 0.0) - job.cpu_req)
                agent.current_ram_usage = max(0.0, (agent.current_ram_usage or 0.0) - job.ram_req)
                db.add(agent)
                db.commit()
                
        if job.started_at and job.finished_at:
            from app.credits.engine import process_job_payment
            duration_sec = (job.finished_at - job.started_at).total_seconds()
            duration_sec = max(1.0, duration_sec) # minimum 1 second billing
            process_job_payment(db, job, duration_sec)
        
    return job

@router.post("/{job_id}/logs", response_model=schemas.JobLog)
def create_job_log(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    log_in: schemas.JobLogCreate,
    current_agent = Depends(deps.get_current_agent),
):
    """
    Append log to job. Restricted to authenticated hardware agents.
    """
    return crud.crud_job.create_log(db, obj_in=log_in, job_id=job_id)

# --- Pipeline Step Endpoints ---

@router.get("/{job_id}/steps", response_model=List[schemas.PipelineStep])
def get_pipeline_steps(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
):
    """
    Get pipeline steps for a job, ordered by step_index.
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return crud.crud_job.get_pipeline_steps(db, job_id=job_id)

@router.put("/{job_id}/steps/{step_index}", response_model=schemas.PipelineStep)
def update_pipeline_step(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    step_index: int,
    step_in: schemas.PipelineStepUpdate,
    current_agent = Depends(deps.get_current_agent),
):
    """
    Update a pipeline step's status, timing, and/or log.
    Restricted to authenticated hardware agents.
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    step = crud.crud_job.get_pipeline_step_by_index(db, job_id=job_id, step_index=step_index)
    if not step:
        raise HTTPException(status_code=404, detail=f"Pipeline step {step_index} not found")
    
    return crud.crud_job.update_pipeline_step(db, db_obj=step, obj_in=step_in)

@router.get("/{job_id}/steps/{step_index}/log", response_model=schemas.JobLogBase)
def get_pipeline_step_log(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    step_index: int,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get the log for a specific pipeline step.
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not current_user.is_superuser and job.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
        
    step = crud.crud_job.get_pipeline_step_by_index(db, job_id=job_id, step_index=step_index)
    if not step:
        raise HTTPException(status_code=404, detail=f"Pipeline step {step_index} not found")
        
    return {"content": step.log or ""}

