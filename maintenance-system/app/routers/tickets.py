from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.ticket import Ticket, TicketStatus
from app.models.activity import ActivityLog, Notification
from app.models.user import User, UserRole
from app.schemas.ticket import (
    TicketCreate, TicketOut, TicketAssign,
    TicketStatusUpdate, TicketPriorityUpdate
)
from app.core.deps import get_current_user, require_role

router = APIRouter(prefix="/tickets", tags=["Tickets"])


def log_activity(db: Session, ticket_id: int, user_id: int, action: str, detail: str = None):
    log = ActivityLog(ticket_id=ticket_id, user_id=user_id, action=action, detail=detail)
    db.add(log)


def create_notification(db: Session, user_id: int, ticket_id: int, message: str):
    notif = Notification(user_id=user_id, ticket_id=ticket_id, message=message)
    db.add(notif)


# ── Tenant: submit a ticket ──────────────────────────────────────────
@router.post("/", response_model=TicketOut, status_code=201)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.tenant))
):
    ticket = Ticket(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        tenant_id=current_user.id
    )
    db.add(ticket)
    db.flush()  # get ticket.id before commit

    log_activity(db, ticket.id, current_user.id, "created",
                 f"Ticket created by {current_user.full_name}")

    managers = db.query(User).filter(User.role == UserRole.manager).all()
    for manager in managers:
        create_notification(
            db,
            manager.id,
            ticket.id,
            f"New maintenance request #{ticket.id}: {ticket.title}"
        )

    db.commit()
    db.refresh(ticket)
    return ticket


# ── Tenant: view own tickets ─────────────────────────────────────────
@router.get("/my", response_model=list[TicketOut])
def my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.tenant))
):
    return db.query(Ticket)\
        .filter(Ticket.tenant_id == current_user.id)\
        .order_by(Ticket.created_at.desc())\
        .all()


# ── Manager: view all tickets ────────────────────────────────────────
@router.get("/", response_model=list[TicketOut])
def all_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager))
):
    query = db.query(Ticket)
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    return query.order_by(Ticket.created_at.desc()).all()


# ── Technician: view assigned tickets ───────────────────────────────
@router.get("/assigned", response_model=list[TicketOut])
def assigned_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.technician))
):
    return db.query(Ticket)\
        .filter(Ticket.technician_id == current_user.id)\
        .order_by(Ticket.created_at.desc())\
        .all()


# ── Get single ticket (all roles) ────────────────────────────────────
@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Tenants can only see their own tickets
    if current_user.role == UserRole.tenant and ticket.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Technicians can only see their assigned tickets
    if current_user.role == UserRole.technician and ticket.technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return ticket


# ── Manager: assign technician ───────────────────────────────────────
@router.patch("/{ticket_id}/assign", response_model=TicketOut)
def assign_ticket(
    ticket_id: int,
    payload: TicketAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    technician = db.query(User).filter(
        User.id == payload.technician_id,
        User.role == UserRole.technician
    ).first()
    if not technician:
        raise HTTPException(status_code=404, detail="Technician not found")

    if ticket.technician_id == payload.technician_id:
        raise HTTPException(
            status_code=400,
            detail=f"Ticket #{ticket.id} is already assigned to {technician.full_name}"
        )

    previous_technician = ticket.technician
    ticket.technician_id = payload.technician_id
    ticket.status = TicketStatus.assigned

    if previous_technician:
        log_activity(
            db,
            ticket.id,
            current_user.id,
            "reassigned",
            f"Reassigned from {previous_technician.full_name} to {technician.full_name} by {current_user.full_name}"
        )
        create_notification(
            db,
            previous_technician.id,
            ticket.id,
            f"Ticket #{ticket.id}: {ticket.title} has been reassigned to {technician.full_name}"
        )
    else:
        log_activity(
            db,
            ticket.id,
            current_user.id,
            "assigned",
            f"Assigned to {technician.full_name} by {current_user.full_name}"
        )

    # Notify the technician
    create_notification(db, technician.id, ticket.id,
                        f"You have been assigned ticket #{ticket.id}: {ticket.title}")

    # Notify the tenant
    create_notification(db, ticket.tenant_id, ticket.id,
                        f"Your ticket #{ticket.id} has been assigned to {technician.full_name}")

    db.commit()
    db.refresh(ticket)
    return ticket


# ── Manager: update priority ─────────────────────────────────────────
@router.patch("/{ticket_id}/priority", response_model=TicketOut)
def update_priority(
    ticket_id: int,
    payload: TicketPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_priority = ticket.priority
    ticket.priority = payload.priority

    log_activity(db, ticket.id, current_user.id, "priority_changed",
                 f"Priority changed from {old_priority} to {payload.priority}")

    if ticket.technician_id:
        create_notification(
            db,
            ticket.technician_id,
            ticket.id,
            f"Priority updated on ticket #{ticket.id}: now {payload.priority.value}"
        )

    db.commit()
    db.refresh(ticket)
    return ticket


# ── Technician + Manager: update status ─────────────────────────────
@router.patch("/{ticket_id}/status", response_model=TicketOut)
def update_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.technician, UserRole.manager))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Technician can only update their own assigned tickets
    if current_user.role == UserRole.technician and ticket.technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your assigned tickets")

    # Enforce status flow: open → assigned → in_progress → done
    valid_transitions = {
        TicketStatus.open: [TicketStatus.assigned],
        TicketStatus.assigned: [TicketStatus.in_progress],
        TicketStatus.in_progress: [TicketStatus.done],
        TicketStatus.done: []
    }
    if payload.status not in valid_transitions[ticket.status]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: {ticket.status} → {payload.status}"
        )

    old_status = ticket.status
    ticket.status = payload.status

    log_activity(db, ticket.id, current_user.id, "status_changed",
                 f"Status changed from {old_status} to {payload.status}")

    if ticket.technician_id and current_user.id != ticket.technician_id:
        create_notification(
            db,
            ticket.technician_id,
            ticket.id,
            f"Ticket #{ticket.id} status changed to {payload.status.value.replace('_', ' ')}"
        )

    if current_user.id != ticket.tenant_id:
        create_notification(
            db,
            ticket.tenant_id,
            ticket.id,
            f"Ticket #{ticket.id} is now {payload.status.value.replace('_', ' ')}"
        )

    # Give managers visibility once work is started or completed
    if payload.status in {TicketStatus.in_progress, TicketStatus.done}:
        managers = db.query(User).filter(User.role == UserRole.manager).all()
        for manager in managers:
            if manager.id != current_user.id:
                create_notification(
                    db,
                    manager.id,
                    ticket.id,
                    f"Ticket #{ticket.id} moved to {payload.status.value.replace('_', ' ')}"
                )

    db.commit()
    db.refresh(ticket)
    return ticket
