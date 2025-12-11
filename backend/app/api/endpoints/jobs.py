from typing import Any, List
import os
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

@router.post("/", response_model=schemas.Job)
def create_job(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    run_command: str = Form(...),
    build_command: str = Form(None),
    cpu_req: int = Form(1),
    ram_req: float = Form(1.0),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit a new job (upload zip).
    """
    # Create DB record
    job_in = schemas.JobCreate(
        run_command=run_command,
        build_command=build_command,
        cpu_req=cpu_req,
        ram_req=ram_req
    )
    job = crud.crud_job.create(db, obj_in=job_in, owner_id=current_user.id)
    
    # Save file
    file_location = f"{UPLOAD_DIR}/{job.id}.zip"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Trigger scheduler (or it runs periodically)
    # For now, just leave it as queued
    
    return job

@router.get("/", response_model=List[schemas.Job])
def read_jobs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    agent_id: int = None,
    status: str = None,
    current_user: User = Depends(deps.get_current_user_optional),
) -> Any:
    """
    Retrieve jobs.
    """
    if agent_id:
        return crud.crud_job.get_multi_by_agent(db, agent_id=agent_id, status=status)
    
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
    Get job details.
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
):
    """
    Download job zip file.
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    file_path = f"uploads/{job_id}.zip"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path, media_type='application/zip', filename=f"{job_id}.zip")

@router.put("/{job_id}", response_model=schemas.Job)
def update_job(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    job_in: schemas.JobUpdate,
    # Allow agents to update status? Yes.
):
    """
    Update job status/results.
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # TODO: Verify agent ownership if agent is calling?
    # For now assume trust or check if job.agent_id matches current agent (if we had auth)
    
    # Simple update
    job = crud.crud_job.update_status(db, db_obj=job, status=job_in.status) 
    # NOTE: crud_update_status only updates status, let's fix that or just update status for now.
    # The schema JobUpdate has status, started_at, finished_at.
    # We should use a proper crud update.
    
    # Hand-roll update for now
    if job_in.finished_at:
        job.finished_at = job_in.finished_at
    
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.post("/{job_id}/logs", response_model=schemas.JobLog)
def create_job_log(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    log_in: schemas.JobLogCreate,
):
    """
    Append log to job.
    """
    return crud.crud_job.create_log(db, obj_in=log_in, job_id=job_id)
