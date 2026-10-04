from fastapi import APIRouter, HTTPException

from app.services.planning_service import (
    get_today_plan,
    get_week_plan,
    get_month_plan,
)


router = APIRouter(
    prefix="/api/planning",
    tags=["Planning"],
)


@router.get("/today")
def planning_today():
    """
    Return today's optimized maintenance block.
    """

    try:

        return get_today_plan()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


@router.get("/week")
def planning_week():
    """
    Return the prototype weekly planning result.
    """

    try:

        return get_week_plan()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


@router.get("/month")
def planning_month():
    """
    Return the prototype monthly planning result.
    """

    try:

        return get_month_plan()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


@router.post("/optimize")
def optimize_plan():
    """
    Re-run the optimization engine and return
    the latest optimized block.
    """

    try:

        return get_today_plan()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )