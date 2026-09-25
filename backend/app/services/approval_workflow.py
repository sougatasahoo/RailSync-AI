from datetime import datetime
from typing import Any

from app.services.block_optimizer import optimize_block_plan


APPROVAL_STATES = {
    "PENDING_REVIEW",
    "APPROVED",
    "RETURNED_FOR_REVISION",
}


_approval_record: dict[str, Any] = {
    "approval_id": "APR-001",
    "status": "PENDING_REVIEW",
    "reviewer": "Block Planning Official",
    "submitted_at": None,
    "reviewed_at": None,
    "remarks": "",
}


def _build_pending_approval() -> dict[str, Any]:
    optimized_plan = optimize_block_plan()

    return {
        "approval_id": _approval_record["approval_id"],
        "status": _approval_record["status"],
        "reviewer": _approval_record["reviewer"],
        "submitted_at": _approval_record["submitted_at"],
        "reviewed_at": _approval_record["reviewed_at"],
        "remarks": _approval_record["remarks"],
        "plan_status": optimized_plan.get("status", "unknown"),
        "solver_status": optimized_plan.get(
            "solver_status",
            "unknown",
        ),
        "summary": optimized_plan.get(
            "summary",
            {},
        ),
        "selected_opportunities": optimized_plan.get(
            "selected_opportunities",
            [],
        ),
    }


def get_approval_workflow() -> dict[str, Any]:
    """
    Return the current proposed-plan approval state.

    This is a local prototype workflow. It is intentionally not
    connected to real railway authentication or authorization.
    """
    return _build_pending_approval()


def submit_for_review() -> dict[str, Any]:
    """
    Submit the current optimized plan for official review.
    """
    optimized_plan = optimize_block_plan()

    if optimized_plan.get("status") != "optimized":
        raise ValueError(
            "An optimized block plan is required before review."
        )

    _approval_record["status"] = "PENDING_REVIEW"
    _approval_record["reviewer"] = "Block Planning Official"
    _approval_record["submitted_at"] = datetime.now().isoformat(
        timespec="seconds"
    )
    _approval_record["reviewed_at"] = None
    _approval_record["remarks"] = ""

    return _build_pending_approval()


def approve_plan(
    reviewer: str,
    remarks: str = "",
) -> dict[str, Any]:
    """
    Approve the currently proposed block plan.

    This represents the human-in-the-loop approval action
    in the prototype.
    """
    optimized_plan = optimize_block_plan()

    if optimized_plan.get("status") != "optimized":
        raise ValueError(
            "An optimized block plan is required before approval."
        )

    if not reviewer.strip():
        raise ValueError(
            "Reviewer name is required."
        )

    _approval_record["status"] = "APPROVED"
    _approval_record["reviewer"] = reviewer.strip()
    _approval_record["reviewed_at"] = datetime.now().isoformat(
        timespec="seconds"
    )
    _approval_record["remarks"] = remarks.strip()

    return _build_pending_approval()


def return_for_revision(
    reviewer: str,
    remarks: str,
) -> dict[str, Any]:
    """
    Return the proposed plan to planning for revision.
    """
    if not reviewer.strip():
        raise ValueError(
            "Reviewer name is required."
        )

    if not remarks.strip():
        raise ValueError(
            "Remarks are required when returning a plan."
        )

    _approval_record["status"] = "RETURNED_FOR_REVISION"
    _approval_record["reviewer"] = reviewer.strip()
    _approval_record["reviewed_at"] = datetime.now().isoformat(
        timespec="seconds"
    )
    _approval_record["remarks"] = remarks.strip()

    return _build_pending_approval()