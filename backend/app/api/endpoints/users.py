from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = crud.crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = crud.crud_user.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/me/transactions", response_model=List[schemas.Transaction])
def read_user_transactions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get transaction history for current user.
    """
    from app.models.transaction import Transaction
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()
    
    return transactions

@router.post("/me/add-credits", response_model=schemas.User)
def add_user_credits(
    amount: float = Body(..., embed=True),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mock endpoint to add credits to the current user.
    """
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
        
    from app.models.transaction import Transaction
    
    current_user.balance += amount
    current_user.low_balance_alert_sent = False
    
    tx = Transaction(
        user_id=current_user.id,
        amount=amount,
        description=f"Initial/Purchased Credit Deposit"
    )
    db.add(tx)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user
