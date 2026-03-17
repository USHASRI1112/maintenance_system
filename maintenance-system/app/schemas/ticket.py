from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.ticket import TicketStatus, TicketPriority
from app.schemas.user import UserOut

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.medium

class TicketAssign(BaseModel):
    technician_id: int

class TicketStatusUpdate(BaseModel):
    status: TicketStatus

class TicketPriorityUpdate(BaseModel):
    priority: TicketPriority

class ActivityLogOut(BaseModel):
    id: int
    action: str
    detail: Optional[str]
    created_at: datetime
    user: UserOut

    class Config:
        from_attributes = True

class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    image_paths: Optional[str]
    image_urls: list[str] = []
    tenant_id: int
    technician_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    tenant: UserOut
    technician: Optional[UserOut]
    activity_logs: list[ActivityLogOut] = []

    class Config:
        from_attributes = True
