# Appointment Board

A full-stack appointment management application built for the Appening Infotech Python Fullstack Intern practical task.

## Features

- View appointments in a responsive board and calendar view.
- Create, edit, complete, and cancel appointments.
- Filter appointments by date and status.
- Keep cancelled appointments visible and clearly labelled.
- Validate required fields and ensure the end time is after the start time.
- Prevent overlapping time slots for active appointments.
- Display clear success, validation, and conflict messages.

## Tech stack

- Frontend: React, Vite, JavaScript, Axios
- Backend: Python 3.10, FastAPI, SQLAlchemy
- Database: PostgreSQL

## Project structure

```text
appointment-board/
|-- backend/     # FastAPI API and SQLAlchemy models
|-- frontend/    # React and Vite user interface
`-- README.md
```

## Run locally

### 1. Create the PostgreSQL database

Create a database named `appointment_board` in pgAdmin or PostgreSQL.

### 2. Configure and run the backend

Create `backend/.env` from the following format. Do not commit this file.

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/appointment_board
```

Then run:

```powershell
cd backend
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API starts at `http://127.0.0.1:8000`. The `appointments` table is created automatically when FastAPI starts.

### 3. Add sample appointments (optional, recommended)

With the backend database created, run this from the repository root:

```powershell
psql -U postgres -d appointment_board -f backend/sample_data.sql
```

You can also open `backend/sample_data.sql` in pgAdmin Query Tool and execute it.

### 4. Run the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in the browser.

## How the frontend communicates with the API

Axios uses relative `/api` URLs. Vite proxies these requests to FastAPI:

```text
React request: /api/appointments
Vite proxy:    http://127.0.0.1:8000/appointments
```

This keeps the API URL in one place and avoids changing the FastAPI backend for browser development.

## API endpoints

- `GET /appointments` - list appointments, with optional date and status filters
- `GET /appointments/{id}` - get one appointment
- `POST /appointments` - create an appointment
- `PUT /appointments/{id}` - update an appointment
- `PATCH /appointments/{id}/complete` - mark as completed
- `PATCH /appointments/{id}/cancel` - mark as cancelled without deleting it

## Assumptions

- The board represents one shared team schedule, so active appointments cannot overlap on the same date.
- Cancelled appointments do not reserve a time slot, but remain in the database and UI for history.
- Completed appointments remain visible and continue to reserve their original slot; only cancelled appointments are excluded from overlap checks.
