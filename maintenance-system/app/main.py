import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.config import settings
from app.routers import auth, users, tickets, files, notifications

Base.metadata.create_all(bind=engine)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Maintenance System", version="1.0.0")

# CORS — needed when frontend connects
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tickets.router)
app.include_router(files.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {"message": "Maintenance System API is running"}
