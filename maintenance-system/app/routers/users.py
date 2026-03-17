from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserOut
from app.core.deps import require_role

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager))
):
    return db.query(User).all()

@router.get("/technicians", response_model=list[UserOut])
def list_technicians(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager))
):
    return db.query(User).filter(User.role == UserRole.technician).all()