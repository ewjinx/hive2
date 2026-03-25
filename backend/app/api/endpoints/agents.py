from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[schemas.Agent])
def read_agents(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve agents belonging to the current user.
    """
    from app.models.agent import Agent
    agents = db.query(Agent).filter(
        Agent.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return agents

@router.post("", response_model=schemas.Agent)
def register_agent(
    *,
    db: Session = Depends(deps.get_db),
    agent_in: schemas.AgentCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Register a new agent (N-to-1 relation allowed). 
    Enforces JWT bearer authentication instead of raw emails.
    """
    from app.models.agent import Agent
    
    # Create new agent bounded to the JWT token bearer
    agent_data = agent_in.dict(exclude={"owner_email"})
    db_obj = Agent(**agent_data, owner_id=current_user.id)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    return db_obj

@router.patch("/{agent_id}", response_model=schemas.Agent)
def update_agent(
    *,
    db: Session = Depends(deps.get_db),
    agent_id: int,
    agent_in: schemas.AgentUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Live sync dynamic specs (ram, cpu limits, status toggles) from the desktop UI to the cloud.
    """
    from app.models.agent import Agent
    
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    if not current_user.is_superuser and agent.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
        
    if agent_in.name is not None:
        agent.name = agent_in.name
    if agent_in.cpu_cores is not None:
        agent.cpu_cores = agent_in.cpu_cores
    if agent_in.ram_gb is not None:
        agent.ram_gb = agent_in.ram_gb
    if agent_in.status is not None:
        agent.status = agent_in.status
        
    db.commit()
    db.refresh(agent)
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
