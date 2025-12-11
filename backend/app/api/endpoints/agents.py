from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[schemas.Agent])
def read_agents(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve agents.
    """
    agents = crud.crud_agent.get_multi(db, skip=skip, limit=limit)
    return agents

@router.post("/", response_model=schemas.Agent)
def register_agent(
    *,
    db: Session = Depends(deps.get_db),
    agent_in: schemas.AgentCreate,
) -> Any:
    """
    Register a new agent.
    """
    # owner_id=1 for default system user or None
    agent = crud.crud_agent.create(db, obj_in=agent_in, owner_id=1)
    return agent

@router.post("/{agent_id}/heartbeat", response_model=schemas.Agent)
def heartbeat(
    *,
    db: Session = Depends(deps.get_db),
    agent_id: int,
    heartbeat_in: schemas.AgentHeartbeat,
    # current_user: User = Depends(deps.get_current_active_user), # Agents might use a different auth, simplest is user auth or token
) -> Any:
    """
    Agent heartbeat.
    """
    agent = crud.crud_agent.get(db, id=agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # In a real system, verify the caller owns the agent or use an agent-token
    agent = crud.crud_agent.update_heartbeat(db, db_obj=agent, obj_in=heartbeat_in)
    return agent
