from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base

class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SYSTEM_ERROR = "system_error"
    ABANDONED = "abandoned"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    
    status = Column(String, default=JobStatus.QUEUED)
    
    cpu_req = Column(Integer, default=1) # requested CPU cores
    ram_req = Column(Float, default=1.0) # requested RAM GB
    
    build_command = Column(String, nullable=True)
    run_command = Column(String, nullable=True)  # nullable for pipeline-based jobs
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    
    cost = Column(Float, default=0.0)
    
    owner = relationship("User", back_populates="jobs")
    agent = relationship("Agent", back_populates="jobs")
    logs = relationship("JobLog", back_populates="job")
    pipeline_steps = relationship("PipelineStep", back_populates="job", order_by="PipelineStep.step_index")

class JobLog(Base):
    __tablename__ = "job_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    content = Column(String, nullable=True) # Could be large text
    
    job = relationship("Job", back_populates="logs")

class PipelineStep(Base):
    __tablename__ = "pipeline_steps"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    step_index = Column(Integer, nullable=False)       # execution order (0, 1, 2, ...)
    name = Column(String, nullable=False)               # e.g. "Install", "Test", "Run"
    command = Column(String, nullable=False)             # e.g. "pip install -r requirements.txt"
    status = Column(String, default="pending")           # pending / running / success / failed
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    log = Column(String, nullable=True)                  # step output / logs

    job = relationship("Job", back_populates="pipeline_steps")
