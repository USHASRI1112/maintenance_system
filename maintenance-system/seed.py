import sys
sys.path.append(".")

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus, TicketPriority
from app.models.activity import ActivityLog, Notification
from app.core.auth import hash_password

db = SessionLocal()

def seed():
    # Clear existing data
    db.query(Notification).delete()
    db.query(ActivityLog).delete()
    db.query(Ticket).delete()
    db.query(User).delete()
    db.commit()

    # Create users
    manager = User(full_name="Manager1", email="manager1@demo.com",
                   hashed_password=hash_password("1234"), role=UserRole.manager)
    tenant1 = User(full_name="Tenant1", email="tenant1@demo.com",
                   hashed_password=hash_password("1234"), role=UserRole.tenant)
    tenant2 = User(full_name="Tenant2", email="tenant2@demo.com",
                   hashed_password=hash_password("1234"), role=UserRole.tenant)
    tech1 = User(full_name="Technician1", email="technician1@demo.com",
                 hashed_password=hash_password("1234"), role=UserRole.technician)

    db.add_all([manager, tenant1, tenant2, tech1])
    db.flush()

    # Create tickets
    t1 = Ticket(title="Leaking pipe in bathroom", description="There is water leaking under the sink",
                status=TicketStatus.done, priority=TicketPriority.high,
                tenant_id=tenant1.id, technician_id=tech1.id)
    t2 = Ticket(title="AC not working", description="The air conditioning unit stopped working",
                status=TicketStatus.in_progress, priority=TicketPriority.urgent,
                tenant_id=tenant1.id, technician_id=tech1.id)
    t3 = Ticket(title="Broken window latch", description="Window in bedroom won't lock properly",
                status=TicketStatus.assigned, priority=TicketPriority.medium,
                tenant_id=tenant2.id, technician_id=tech1.id)
    t4 = Ticket(title="Electricity flickering", description="Lights flicker in the living room",
                status=TicketStatus.open, priority=TicketPriority.high,
                tenant_id=tenant2.id)
    t5 = Ticket(title="Mold on ceiling", description="Black mold appearing in the corner of the ceiling",
                status=TicketStatus.open, priority=TicketPriority.urgent,
                tenant_id=tenant1.id)

    db.add_all([t1, t2, t3, t4, t5])
    db.flush()

    # Activity logs
    logs = [
        ActivityLog(ticket_id=t1.id, user_id=tenant1.id, action="created", detail="Ticket created by Tenant1"),
        ActivityLog(ticket_id=t1.id, user_id=manager.id, action="assigned", detail="Assigned to Technician1"),
        ActivityLog(ticket_id=t1.id, user_id=tech1.id, action="status_changed", detail="Status changed from assigned to in_progress"),
        ActivityLog(ticket_id=t1.id, user_id=tech1.id, action="status_changed", detail="Status changed from in_progress to done"),
        ActivityLog(ticket_id=t2.id, user_id=tenant1.id, action="created", detail="Ticket created by Tenant1"),
        ActivityLog(ticket_id=t2.id, user_id=manager.id, action="assigned", detail="Assigned to Technician1"),
        ActivityLog(ticket_id=t3.id, user_id=tenant2.id, action="created", detail="Ticket created by Tenant2"),
        ActivityLog(ticket_id=t4.id, user_id=tenant2.id, action="created", detail="Ticket created by Tenant2"),
        ActivityLog(ticket_id=t5.id, user_id=tenant1.id, action="created", detail="Ticket created by Tenant1"),
    ]
    db.add_all(logs)
    db.commit()
    print("✅ Seed complete!")
    print("── Login credentials (all use password: 1234) ──")
    print("  manager1@demo.com      → manager")
    print("  tenant1@demo.com       → tenant")
    print("  tenant2@demo.com       → tenant")
    print("  technician1@demo.com   → technician")

seed()
db.close()
