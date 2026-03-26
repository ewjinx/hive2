from typing import Optional
from pydantic import BaseModel, EmailStr

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False

import re
from pydantic import BaseModel, EmailStr, validator

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str

    @validator('password')
    def password_strong(cls, v):
        if len(v) < 8: raise ValueError('Password must be at least 8 characters long')
        if not re.search(r"[A-Z]", v): raise ValueError('Password must contain an uppercase letter')
        if not re.search(r"[a-z]", v): raise ValueError('Password must contain a lowercase letter')
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v): raise ValueError('Password must contain a special character')
        return v

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None
    balance: float = 0.0

    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    low_balance_alert_sent: Optional[bool] = False
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str
