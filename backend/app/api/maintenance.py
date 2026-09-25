from fastapi import APIRouter, HTTPException

from app.services.maintenance_prioritization import (
    get_prioritization_summary,
    prioritize_maintenance_requests,
)


router = APIRouter(
    prefix="/api/maintenance",
    tags=["Maintenance Intelligence"],
)


@router.get("/prioritized")
def get_prioritized_maintenance():
    """
    Return all maintenance requests ranked by
    RailSync AI priority intelligence.
    """

    try:
        records = prioritize_maintenance_requests()

        return {
            "status": "success",
            "total_requests": len(records),
            "requests": records,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to prioritize maintenance requests: {exc}",
        ) from exc


@router.get("/summary")
def get_maintenance_priority_summary():
    """
    Return a compact summary of maintenance priorities.
    """

    try:
        summary = get_prioritization_summary()

        return {
            "status": "success",
            **summary,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to build maintenance summary: {exc}",
        ) from exc