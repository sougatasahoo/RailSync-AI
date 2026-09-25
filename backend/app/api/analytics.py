from fastapi import APIRouter, HTTPException

from app.services.analytics_reports import (
    get_analytics_report,
    get_analytics_summary,
)


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics & Reports"],
)


@router.get("/report")
def analytics_report():
    try:
        return get_analytics_report()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate analytics report: "
                f"{exc}"
            ),
        ) from exc


@router.get("/summary")
def analytics_summary():
    try:
        return get_analytics_summary()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate analytics summary: "
                f"{exc}"
            ),
        ) from exc