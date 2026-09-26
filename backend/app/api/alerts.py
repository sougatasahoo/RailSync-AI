from fastapi import APIRouter, HTTPException

from app.services.alerts_notifications import (
    get_alert_summary,
    get_alerts,
)


router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts & Notifications"],
)


@router.get("")
def alerts():
    try:
        return get_alerts()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate alerts: {exc}",
        ) from exc


@router.get("/summary")
def alert_summary():
    try:
        return get_alert_summary()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate alert summary: {exc}",
        ) from exc