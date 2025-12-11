from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class AgentBase(BaseModel):
    name: Optional[str] = None
    cpu_cores: Optional[int] = None
    ram_gb: Optional[float] = None
    status: Optional[str] = "offline"

class AgentCreate(AgentBase):
    name: str
    cpu_cores: int
    ram_gb: float

class AgentUpdate(AgentBase):
    pass

class AgentHeartbeat(BaseModel):
    current_cpu_usage: float
    current_ram_usage: float
    status: str = "idle"

class AgentInDBBase(AgentBase):
    id: Optional[int] = None
    owner_id: Optional[int] = None
    last_heartbeat: Optional[datetime] = None
    current_cpu_usage: Optional[float] = 0.0
    current_ram_usage: Optional[float] = 0.0

    class Config:
        from_attributes = True

class Agent(AgentInDBBase):
    pass
