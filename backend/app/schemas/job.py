from typing import Optional, List
from pydantic import BaseModel, model_validator
from datetime import datetime

# --- Pipeline Step Schemas ---

class PipelineStepBase(BaseModel):
    name: str
    command: str

class PipelineStepCreate(PipelineStepBase):
    pass

class PipelineStepUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    log: Optional[str] = None

class PipelineStep(PipelineStepBase):
    id: int
    job_id: int
    step_index: int
    status: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    log: Optional[str] = None

    class Config:
        from_attributes = True

# --- Job Schemas ---

class JobBase(BaseModel):
    cpu_req: int = 1
    ram_req: float = 1.0
    build_command: Optional[str] = None
    run_command: Optional[str] = None  # optional when using pipeline steps
    array_size: Optional[int] = 1
    env_vars: Optional[dict] = None

class JobCreate(JobBase):
    steps: Optional[List[PipelineStepCreate]] = None

    @model_validator(mode='after')
    def check_has_command_or_steps(self):
        if not self.run_command and not self.steps:
            raise ValueError('Either run_command or steps must be provided')
        return self

class JobUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    cost: Optional[float] = None

class JobInDBBase(JobBase):
    id: int
    owner_id: int
    agent_id: Optional[int] = None
    parent_id: Optional[int] = None
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    cost: float

    class Config:
        from_attributes = True

class Job(JobInDBBase):
    pipeline_steps: Optional[List[PipelineStep]] = []

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
    pipeline_steps: List[PipelineStep] = []

    class Config:
        from_attributes = True

class Job(JobInDBBase):
    pass
