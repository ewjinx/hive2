"""
WebSocket routes for real-time updates.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import asyncio
import json

from app.core.websocket import manager
from app.api import deps
from app.models.job import Job, JobLog
from app.models.agent import Agent
from app.models.transaction import Transaction
from sqlalchemy import func as sql_func

router = APIRouter()


def _get_dashboard_snapshot(db: Session) -> dict:
    """Build a compact dashboard snapshot for broadcasting."""
    from app.api.endpoints.analytics import (
        _job_distribution, _online_agents, _credit_totals, _resources
    )
    
    dist = _job_distribution(db)
    agents = _online_agents(db)
    
    return {
        "type": "dashboard_update",
        "jobDistribution": dist,
        "resources": _resources(agents),
        "credits": _credit_totals(db),
        "queue": dist["pending"],
        "running": dist["running"],
        "completed": dist["completed"],
        "agentsOnline": len(agents),
    }


@router.websocket("/ws/dashboard")
async def ws_dashboard(websocket: WebSocket):
    """
    Live dashboard updates. Pushes analytics snapshots every 3 seconds.
    Replaces frontend polling for the dashboard page.
    """
    from app.db.session import SessionLocal
    
    channel = "dashboard"
    await manager.connect(websocket, channel)
    
    try:
        while True:
            db = SessionLocal()
            try:
                snapshot = _get_dashboard_snapshot(db)
                await manager.send_personal(websocket, snapshot)
            finally:
                db.close()
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception:
        manager.disconnect(websocket, channel)


@router.websocket("/ws/jobs/{job_id}/logs")
async def ws_job_logs(websocket: WebSocket, job_id: int):
    """
    Live log streaming for a specific job.
    Pushes new log content as it arrives in the database.
    """
    from app.db.session import SessionLocal
    
    channel = f"job:{job_id}"
    await manager.connect(websocket, channel)
    
    last_log_count = 0
    
    try:
        while True:
            db = SessionLocal()
            try:
                job = db.query(Job).filter(Job.id == job_id).first()
                if not job:
                    await manager.send_personal(websocket, {
                        "type": "error", "message": "Job not found"
                    })
                    break
                
                # Get logs
                logs = db.query(JobLog).filter(JobLog.job_id == job_id).all()
                current_count = len(logs)
                
                # Send update if there are new logs or status changed
                log_contents = [l.content or "" for l in logs]
                
                # Get pipeline steps if any
                steps_data = []
                for step in job.pipeline_steps:
                    steps_data.append({
                        "id": step.id,
                        "name": step.name,
                        "status": step.status,
                        "log": step.log or "",
                        "step_index": step.step_index,
                    })
                
                await manager.send_personal(websocket, {
                    "type": "job_update",
                    "job_id": job_id,
                    "status": job.status,
                    "logs": log_contents,
                    "pipeline_steps": steps_data,
                    "cost": job.cost,
                    "started_at": str(job.started_at) if job.started_at else None,
                    "finished_at": str(job.finished_at) if job.finished_at else None,
                })
                
                last_log_count = current_count
                
                # If job is terminal, send final update and close
                if job.status in ["success", "failed", "system_error", "abandoned"]:
                    await asyncio.sleep(1)  # One final push
                    break
                    
            finally:
                db.close()
            
            await asyncio.sleep(1.5)  # Poll DB every 1.5s for new logs
            
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(websocket, channel)
