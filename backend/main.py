from datetime import date as Date

from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy.orm import Session

import crud
import models  # Ensures SQLAlchemy registers the Appointment model with Base.
import schemas
from database import Base, engine, get_db

app = FastAPI(
    title="Appointment Board API",
    description="API for managing team appointments",
    version="1.0.0"
)


@app.on_event("startup")
def create_database_tables():
    """Create database tables that do not already exist."""
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "Appointment Board API is running"
    }


def get_appointment_or_404(db: Session, appointment_id: int):
    """Return an appointment or raise a consistent not-found error."""
    appointment = crud.get_appointment(db, appointment_id)
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )
    return appointment


@app.get(
    "/appointments",
    response_model=list[schemas.AppointmentResponse],
    tags=["Appointments"],
    summary="List appointments",
)
def read_appointments(
    appointment_date: Date | None = Query(default=None, alias="date"),
    appointment_status: schemas.AppointmentStatus | None = Query(
        default=None, alias="status"
    ),
    db: Session = Depends(get_db),
):
    """Return appointments, optionally filtered by date and status."""
    return crud.get_appointments(db, appointment_date, appointment_status)


@app.get(
    "/appointments/{appointment_id}",
    response_model=schemas.AppointmentResponse,
    tags=["Appointments"],
    summary="Get one appointment",
)
def read_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Return one appointment by its ID."""
    return get_appointment_or_404(db, appointment_id)


@app.post(
    "/appointments",
    response_model=schemas.AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Appointments"],
    summary="Create an appointment",
)
def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
):
    """Create an appointment. Time conflicts are raised by the CRUD layer."""
    return crud.create_appointment(db, appointment)


@app.put(
    "/appointments/{appointment_id}",
    response_model=schemas.AppointmentResponse,
    tags=["Appointments"],
    summary="Update an appointment",
)
def update_appointment(
    appointment_id: int,
    appointment_update: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
):
    """Update an appointment. Time conflicts are raised by the CRUD layer."""
    db_appointment = get_appointment_or_404(db, appointment_id)
    return crud.update_appointment(db, db_appointment, appointment_update)


@app.patch(
    "/appointments/{appointment_id}/complete",
    response_model=schemas.AppointmentResponse,
    tags=["Appointments"],
    summary="Complete an appointment",
)
def complete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Mark an existing appointment as completed."""
    db_appointment = get_appointment_or_404(db, appointment_id)
    return crud.complete_appointment(db, db_appointment)


@app.patch(
    "/appointments/{appointment_id}/cancel",
    response_model=schemas.AppointmentResponse,
    tags=["Appointments"],
    summary="Cancel an appointment",
)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Mark an existing appointment as cancelled without deleting it."""
    db_appointment = get_appointment_or_404(db, appointment_id)
    return crud.cancel_appointment(db, db_appointment)
