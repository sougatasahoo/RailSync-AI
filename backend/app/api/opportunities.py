from fastapi import APIRouter, HTTPException, Query

from app.services.opportunity_service import (
    get_opportunities,
    get_opportunity_summary,
)


router = APIRouter(
    prefix="/api/opportunities",
    tags=["Joint Opportunities"],
)


@router.get("/")
def list_opportunities(
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
):
    """
    Return ranked joint maintenance opportunities.
    """

    try:
        opportunities = get_opportunities(limit)

        return {
            "status": "success",
            "count": len(opportunities),
            "opportunities": opportunities,
        }

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )


@router.get("/summary")
def opportunity_summary():
    """
    Return summary information about generated opportunities.
    """

    try:
        return {
            "status": "success",
            "summary": get_opportunity_summary(),
        }

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )