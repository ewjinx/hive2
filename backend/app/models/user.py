from sqlalchemy import Boolean, Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    balance = Column(Float, default=100.0) # Start with credits
    low_balance_alert_sent = Column(Boolean(), default=False)

    jobs = relationship("Job", back_populates="owner")
    transactions = relationship("Transaction", back_populates="user")
