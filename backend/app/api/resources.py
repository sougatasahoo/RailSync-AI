from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.resource_readiness import (
    get_resource_readiness,
    get_resource_readiness_summary,
)


router = APIRouter(
    prefix="/api/resources",
    tags=["Resource Readiness"],
)


@router.get("/readiness")
def resource_readiness():
    """
    Return detailed manpower, machine and material
    readiness information.
    """

    try:
        return get_resource_readiness()

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to calculate resource readiness: "
                f"{exc}"
            ),
        ) from exc


@router.get("/summary")
def resource_readiness_summary():
    """
    Return a compact resource-readiness summary.
    """

    try:
        return get_resource_readiness_summary()

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to calculate resource readiness "
                f"summary: {exc}"
            ),
        ) from exc