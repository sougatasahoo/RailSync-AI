from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.approval_workflow import (
    approve_plan,
    get_approval_workflow,
    return_for_revision,
    submit_for_review,
)
from app.services.bdms_handoff import (
    generate_bdms_handoff,
)
from app.services.block_optimizer import (
    optimize_block_plan,
)
from app.services.conflict_analysis import (
    analyze_conflicts,
    get_conflict_summary,
)
from app.services.joint_opportunity_detection import (
    detect_joint_opportunities,
    get_joint_opportunity_summary,
)


router = APIRouter(
    prefix="/api/planning",
    tags=["Block Planning"],
)


class ApprovalRequest(BaseModel):
    reviewer: str
    remarks: str = ""


@router.get("/joint-opportunities")
def get_joint_opportunities():
    try:
        opportunities = detect_joint_opportunities()

        return {
            "status": "success",
            "total_opportunities": len(opportunities),
            "opportunities": opportunities,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to detect joint planning "
                f"opportunities: {exc}"
            ),
        ) from exc


@router.get("/joint-opportunities/summary")
def get_joint_opportunity_summary_api():
    try:
        summary = get_joint_opportunity_summary()

        return {
            "status": "success",
            **summary,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to build joint opportunity "
                f"summary: {exc}"
            ),
        ) from exc


@router.get("/conflicts")
def get_planning_conflicts():
    try:
        conflicts = analyze_conflicts()

        return {
            "status": "success",
            "total_analyzed": len(conflicts),
            "conflicts": conflicts,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to analyze planning conflicts: "
                f"{exc}"
            ),
        ) from exc


@router.get("/conflicts/summary")
def get_planning_conflict_summary():
    try:
        summary = get_conflict_summary()

        return {
            "status": "success",
            **summary,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to build conflict-analysis "
                f"summary: {exc}"
            ),
        ) from exc


@router.get("/optimized-plan")
def get_optimized_block_plan():
    try:
        result = optimize_block_plan()

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate optimized block plan: "
                f"{exc}"
            ),
        ) from exc


@router.get("/optimized-plan/summary")
def get_optimized_block_plan_summary():
    try:
        result = optimize_block_plan()

        summary = result.get(
            "summary",
            {},
        )

        return {
            "status": result.get(
                "status",
                "unknown",
            ),
            "solver_status": result.get(
                "solver_status",
                "unknown",
            ),
            **summary,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to build optimized-plan "
                f"summary: {exc}"
            ),
        ) from exc


# ============================================================
# HUMAN APPROVAL
# ============================================================

@router.get("/approval")
def get_current_approval():
    """
    Return the current human-approval state
    for the proposed block plan.
    """
    try:
        return get_approval_workflow()

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load approval workflow: "
                f"{exc}"
            ),
        ) from exc


@router.post("/approval/submit")
def submit_plan_for_review():
    """
    Submit the optimized block plan for
    official review.
    """
    try:
        return submit_for_review()

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to submit plan for review: "
                f"{exc}"
            ),
        ) from exc


@router.post("/approval/approve")
def approve_current_plan(
    request: ApprovalRequest,
):
    """
    Approve the proposed block plan.
    """
    try:
        return approve_plan(
            reviewer=request.reviewer,
            remarks=request.remarks,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to approve block plan: "
                f"{exc}"
            ),
        ) from exc


@router.post("/approval/return")
def return_current_plan_for_revision(
    request: ApprovalRequest,
):
    """
    Return the proposed block plan for revision.
    """
    try:
        return return_for_revision(
            reviewer=request.reviewer,
            remarks=request.remarks,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to return block plan "
                f"for revision: {exc}"
            ),
        ) from exc


# ============================================================
# BDMS HANDOFF
# ============================================================

@router.get("/bdms-handoff")
def get_bdms_handoff():
    """
    Generate the structured BDMS handoff package
    from the approved block plan.
    """
    try:
        return generate_bdms_handoff()

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate BDMS handoff: "
                f"{exc}"
            ),
        ) from exc