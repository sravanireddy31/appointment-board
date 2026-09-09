"""SQLAlchemy database models for the Appointment Board."""

from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Enum, Integer, String, Text, Time

from database import Base


class Appointment(Base):
    """A single appointment stored in the appointment board."""

    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(
        Enum("scheduled", "completed", "cancelled", name="appointment_status"),
        nullable=False,
        default="scheduled",
        index=True,
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
