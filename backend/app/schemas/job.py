from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class JobBase(BaseModel):
    cpu_req: int = 1
    ram_req: float = 1.0
    build_command: Optional[str] = None
    run_command: str

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    cost: Optional[float] = None

class JobLogBase(BaseModel):
    content: str

class JobLogCreate(JobLogBase):
    pass

class JobLog(JobLogBase):
    id: int
    job_id: int

    class Config:
        from_attributes = True

class JobInDBBase(JobBase):
    id: int
    owner_id: int
    agent_id: Optional[int] = None
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    cost: Optional[float] = 0.0

    class Config:
        from_attributes = True

class Job(JobInDBBase):
    pass
