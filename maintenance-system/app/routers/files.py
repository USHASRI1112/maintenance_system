import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ticket import Ticket
from app.models.user import User, UserRole
from app.models.activity import ActivityLog
from app.config import settings
from app.core.deps import get_current_user

router = APIRouter(prefix="/tickets", tags=["Files"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def log_activity(db, ticket_id, user_id, action, detail=None):
    log = ActivityLog(ticket_id=ticket_id, user_id=user_id, action=action, detail=detail)
    db.add(log)


@router.post("/{ticket_id}/upload")
async def upload_images(
    ticket_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Only the tenant who owns the ticket can upload
    if current_user.role == UserRole.tenant and ticket.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images per ticket")

    saved_paths = []

    for file in files:
        # Validate file type
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename} is not a valid image. Allowed: jpeg, png, webp, gif"
            )

        # Read and validate size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename} exceeds 5MB limit"
            )

        # Save with unique name to avoid collisions
        ext = file.filename.split(".")[-1]
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as f:
            f.write(contents)

        saved_paths.append(f"/uploads/{unique_name}")

    # Append to existing image paths
    existing = ticket.image_paths or ""
    existing_list = [p for p in existing.split(",") if p]
    all_paths = existing_list + saved_paths
    ticket.image_paths = ",".join(all_paths)

    log_activity(db, ticket.id, current_user.id, "images_uploaded",
                 f"{len(saved_paths)} image(s) uploaded")

    db.commit()

    return {
        "message": f"{len(saved_paths)} file(s) uploaded successfully",
        "paths": saved_paths,
        "all_images": all_paths
    }


@router.delete("/{ticket_id}/images")
def delete_image(
    ticket_id: int,
    image_path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.tenant and ticket.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    existing_list = [p for p in (ticket.image_paths or "").split(",") if p]
    if image_path not in existing_list:
        raise HTTPException(status_code=404, detail="Image not found on this ticket")

    # Delete from disk
    file_name = image_path.replace("/uploads/", "")
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)
    if os.path.exists(file_path):
        os.remove(file_path)

    existing_list.remove(image_path)
    ticket.image_paths = ",".join(existing_list)

    log_activity(db, ticket.id, current_user.id, "image_deleted",
                 f"Image {image_path} deleted")

    db.commit()
    return {"message": "Image deleted", "remaining_images": existing_list}