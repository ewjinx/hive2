@router.get("/{job_id}/download")
def download_job_file(
    job_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_optional),
):
    """
    Download job zip file.
    """
    job = crud.crud_job.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Allow agents (if current_user is None but we trust internal network? No, better use agent_id param/auth)
    # For now allow public/optional for agents
    
    file_path = f"uploads/{job_id}.zip"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path, media_type='application/zip', filename=f"{job_id}.zip")
