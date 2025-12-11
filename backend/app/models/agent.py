from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id")) # Optional: link agent to user for earnings
    
    cpu_cores = Column(Integer)
    ram_gb = Column(Float)
    
    status = Column(String, default="offline") # offline, idle, busy
    last_heartbeat = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Stats can be stored in a separate table or here for simplicity
    current_cpu_usage = Column(Float, default=0.0)
    current_ram_usage = Column(Float, default=0.0)
    
    jobs = relationship("Job", back_populates="agent")
