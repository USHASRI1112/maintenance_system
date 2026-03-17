# Property Maintenance Management System

A mobile-first property maintenance management demo built for tenants, managers, and technicians.

## Overview

This project streamlines maintenance issue reporting and resolution across three roles:

- Tenant: create tickets and upload images
- Manager: review all tickets, assign or reassign technicians, update priority and status
- Technician: view assigned work and move tasks through completion

The system includes role-based authentication, activity logs, in-app notifications, image uploads, and seeded demo data.

## Monorepo Structure

```text
.
├── maintenance-system/
│   └── FastAPI backend
└── maintenance-system-frontend/
    └── React + Vite frontend
```

## Features

- Role-based authentication
- Tenant ticket creation
- Image upload support
- Manager assignment and reassignment
- Priority management
- Status workflow:
  - Open
  - Assigned
  - In Progress
  - Done
- Ticket activity logs
- In-app notifications
- Responsive web UI

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- SQLite
- JWT authentication
- Python

### Frontend

- React
- Vite
- Axios
- React Router

## Demo Accounts

All seeded accounts use password `1234`.

- `manager1@demo.com`
- `tenant1@demo.com`
- `tenant2@demo.com`
- `technician1@demo.com`

## Local Setup

### 1. Backend

```bash
cd maintenance-system
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
./venv/bin/python seed.py
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

### 2. Frontend

```bash
cd maintenance-system-frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Environment

### Backend `.env`

Create a `.env` file in `maintenance-system/` with:

```env
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./maintenance.db
UPLOAD_DIR=app/uploads
```

### Frontend

Optional:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Workflow

### Tenant

- Sign in
- Create maintenance request
- Upload images
- Track ticket updates
- View notifications

### Manager

- View all tickets
- Filter by status and priority
- Assign or reassign technicians
- Update priority
- Advance ticket status
- Review activity logs

### Technician

- View assigned tickets
- Update assigned work from Assigned to In Progress to Done
- Review notifications

## Submission Notes

This project was built as a focused working demo based on the given brief.

It emphasizes:

- practical backend structure
- clean role-based workflow
- usable responsive UI
- realistic manager and technician flows

## Recommended Demo Flow

1. Sign in as `tenant1@demo.com`
2. Create a new ticket with an image
3. Sign in as `manager1@demo.com`
4. Assign or reassign the ticket
5. Update priority or status
6. Sign in as `technician1@demo.com`
7. Move the ticket to `In Progress` and then `Done`
8. Open notifications from the bell icon and jump to the related ticket

## Future Improvements

- email notifications
- automated tests
- Docker setup
- cloud storage for uploads
- stronger admin analytics
- audit and reporting screens

