"""Database operations for appointments."""

from datetime import date, time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas


def get_appointments(
    db: Session,
    appointment_date: date | None = None,
    appointment_status: str | None = None,
) -> list[models.Appointment]:
    """Return appointments, optionally filtered by date and status."""
    query = db.query(models.Appointment)

    if appointment_date is not None:
        query = query.filter(models.Appointment.date == appointment_date)
    if appointment_status is not None:
        query = query.filter(models.Appointment.status == appointment_status)

    return query.order_by(models.Appointment.date, models.Appointment.start_time).all()


def get_appointment(db: Session, appointment_id: int) -> models.Appointment | None:
    """Return one appointment by ID, or None when it does not exist."""
    return (
        db.query(models.Appointment)
        .filter(models.Appointment.id == appointment_id)
        .first()
    )


def _validate_time_order(start_time: time, end_time: time) -> None:
    """Raise a clear error when an appointment ends before it starts."""
    if end_time <= start_time:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="End time must be after start time.",
        )


def _get_conflicting_appointment(
    db: Session,
    appointment_date: date,
    start_time: time,
    end_time: time,
    exclude_appointment_id: int | None = None,
) -> models.Appointment | None:
    """Find an active appointment that overlaps the requested time slot."""
    query = db.query(models.Appointment).filter(
        models.Appointment.date == appointment_date,
        models.Appointment.status != "cancelled",
        start_time < models.Appointment.end_time,
        end_time > models.Appointment.start_time,
    )

    if exclude_appointment_id is not None:
        query = query.filter(models.Appointment.id != exclude_appointment_id)

    return query.first()


def create_appointment(
    db: Session, appointment: schemas.AppointmentCreate
) -> models.Appointment:
    """Create an appointment after checking its time range and availability."""
    _validate_time_order(appointment.start_time, appointment.end_time)

    conflict = _get_conflicting_appointment(
        db, appointment.date, appointment.start_time, appointment.end_time
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot overlaps with an existing appointment.",
        )

    db_appointment = models.Appointment(**appointment.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def update_appointment(
    db: Session,
    db_appointment: models.Appointment,
    appointment_update: schemas.AppointmentUpdate,
) -> models.Appointment:
    """Partially update an appointment after checking its resulting time slot."""
    if db_appointment.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Completed appointments cannot be edited.",
        )
    if db_appointment.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cancelled appointments cannot be edited.",
        )

    update_data = appointment_update.model_dump(exclude_unset=True)
    updated_date = update_data.get("date", db_appointment.date)
    updated_start_time = update_data.get("start_time", db_appointment.start_time)
    updated_end_time = update_data.get("end_time", db_appointment.end_time)
    updated_status = update_data.get("status", db_appointment.status)

    _validate_time_order(updated_start_time, updated_end_time)

    # A cancelled appointment does not reserve a time slot.
    if updated_status != "cancelled":
        conflict = _get_conflicting_appointment(
            db,
            updated_date,
            updated_start_time,
            updated_end_time,
            exclude_appointment_id=db_appointment.id,
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This time slot overlaps with an existing appointment.",
            )

    for field, value in update_data.items():
        setattr(db_appointment, field, value)

    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def complete_appointment(
    db: Session, db_appointment: models.Appointment
) -> models.Appointment:
    """Mark an appointment as completed without deleting it."""
    if db_appointment.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Appointment is already completed.",
        )
    if db_appointment.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cancelled appointments cannot be completed.",
        )

    db_appointment.status = "completed"
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def cancel_appointment(
    db: Session, db_appointment: models.Appointment
) -> models.Appointment:
    """Mark an appointment as cancelled without deleting it."""
    if db_appointment.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Completed appointments cannot be cancelled.",
        )
    if db_appointment.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Appointment is already cancelled.",
        )

    db_appointment.status = "cancelled"
    db.commit()
    db.refresh(db_appointment)
    return db_appointment
