"""Pydantic schemas for validating Appointment API data."""

from datetime import date as Date, datetime, time as Time
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


AppointmentStatus = Literal["scheduled", "completed", "cancelled"]


class AppointmentBase(BaseModel):
    """Fields shared by appointment create and response data."""

    title: str
    description: str | None = None
    date: Date
    start_time: Time
    end_time: Time
    status: AppointmentStatus = "scheduled"

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: str) -> str:
        """Reject titles made only of whitespace."""
        value = value.strip()
        if not value:
            raise ValueError("Title must not be empty.")
        return value

    @model_validator(mode="after")
    def end_time_must_be_after_start_time(self):
        """Ensure an appointment finishes after it starts."""
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time.")
        return self


class AppointmentCreate(AppointmentBase):
    """Data required to create an appointment."""


class AppointmentUpdate(BaseModel):
    """Optional fields accepted when partially updating an appointment."""

    title: str | None = None
    description: str | None = None
    date: Date | None = None
    start_time: Time | None = None
    end_time: Time | None = None
    status: AppointmentStatus | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: str | None) -> str | None:
        if value is None:
            return value

        value = value.strip()
        if not value:
            raise ValueError("Title must not be empty.")
        return value

    @model_validator(mode="after")
    def end_time_must_be_after_start_time(self):
        """Validate time order when both times are included in the update."""
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.end_time <= self.start_time
        ):
            raise ValueError("End time must be after start time.")
        return self


class AppointmentResponse(AppointmentBase):
    """Appointment data returned by the API."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
