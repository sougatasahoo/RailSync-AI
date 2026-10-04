from fastapi import APIRouter, HTTPException, Query

from app.services.maintenance_service import (
    get_maintenance,
    get_maintenance_request,
    get_maintenance_summary,
)


router = APIRouter(
    prefix="/api/maintenance",
    tags=["Maintenance"],
)


@router.get("/")
def maintenance_list(
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    department: str | None = None,
    section_code: str | None = None,
    status: str | None = None,
    search: str | None = None,
):
    try:
        records = get_maintenance(
            limit=limit,
            department=department,
            section_code=section_code,
            status=status,
            search=search,
        )

        return {
            "status": "success",
            "count": len(records),
            "records": records,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


@router.get("/summary")
def maintenance_summary():
    try:
        return {
            "status": "success",
            "summary": get_maintenance_summary(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


@router.get("/{request_id}")
def maintenance_request(request_id: str):
    try:
        record = get_maintenance_request(request_id)

        if record is None:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance request not found: {request_id}",
            )

        return {
            "status": "success",
            "record": record,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )