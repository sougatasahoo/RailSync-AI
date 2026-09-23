from datetime import date
from enum import Enum

from pydantic import BaseModel, Field


class Department(str, Enum):
    TMS = "TMS"
    SMMS = "SMMS"
    TDMS = "TDMS"


class Priority(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class MaintenanceStatus(str, Enum):
    OPEN = "Open"
    PLANNED = "Planned"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class MaintenanceRequest(BaseModel):
    request_id: str
    source_system: Department

    activity: str
    asset_type: str
    asset_id: str

    location: str
    section: str

    priority: Priority
    status: MaintenanceStatus

    reported_date: date
    due_date: date

    estimated_duration_hours: float = Field(gt=0)

    block_required: bool

    operational_impact: str

    required_manpower: int = Field(ge=0)
    required_machine: str | None = None
    required_materials: list[str] = Field(default_factory=list)