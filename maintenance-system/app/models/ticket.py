from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class TicketStatus(str, enum.Enum):
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    done = "done"

class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.open, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.medium, nullable=False)
    image_paths = Column(Text, default="")  # comma-separated file paths

    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # assigned later

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tenant = relationship("User", back_populates="submitted_tickets", foreign_keys=[tenant_id])
    technician = relationship("User", back_populates="assigned_tickets", foreign_keys=[technician_id])
    activity_logs = relationship("ActivityLog", back_populates="ticket", order_by="ActivityLog.created_at.desc()")
    notifications = relationship("Notification", back_populates="ticket")

    @property
    def image_urls(self) -> list[str]:
        if not self.image_paths:
            return []
        return [path for path in self.image_paths.split(",") if path]
