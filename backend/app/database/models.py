from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    request_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    department: Mapped[str] = mapped_column(
        String(20),
        index=True,
    )

    section: Mapped[str] = mapped_column(
        String(100),
    )

    location: Mapped[str] = mapped_column(
        String(100),
    )

    defect_type: Mapped[str] = mapped_column(
        String(150),
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        index=True,
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
    )

    required_resource: Mapped[str] = mapped_column(
        String(100),
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Pending",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


class BlockPlan(Base):
    __tablename__ = "block_plans"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    plan_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    section: Mapped[str] = mapped_column(
        String(100),
    )

    start_time: Mapped[str] = mapped_column(
        String(20),
    )

    end_time: Mapped[str] = mapped_column(
        String(20),
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Pending Approval",
    )

    optimization_status: Mapped[str] = mapped_column(
        String(50),
        default="Feasible",
    )

    jobs_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    plan_id: Mapped[str] = mapped_column(
        String(50),
        index=True,
    )

    decision: Mapped[str] = mapped_column(
        String(30),
        default="Pending",
    )

    controller_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )