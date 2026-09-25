from datetime import datetime
from typing import Any

from app.services.approval_workflow import get_approval_workflow


def generate_bdms_handoff() -> dict[str, Any]:
    """
    Generate a BDMS-ready handoff package from the
    human-approved block plan.

    This is a prototype handoff representation.
    It does not connect to a real BDMS system.
    """

    approval = get_approval_workflow()

    if approval.get("status") != "APPROVED":
        raise ValueError(
            "The block plan must be approved before "
            "generating a BDMS handoff."
        )

    selected_opportunities = approval.get(
        "selected_opportunities",
        [],
    )

    if not selected_opportunities:
        raise ValueError(
            "No approved block opportunities are available "
            "for BDMS handoff."
        )

    handoff_items = []

    for item in selected_opportunities:
        handoff_items.append(
            {
                "opportunity_id": item.get(
                    "opportunity_id"
                ),
                "request_ids": item.get(
                    "request_ids",
                    [],
                ),
                "section": item.get(
                    "section"
                ),
                "date": item.get(
                    "date"
                ),
                "window_id": item.get(
                    "window_id"
                ),
                "window_type": item.get(
                    "window_type"
                ),
                "planned_duration_hours": item.get(
                    "duration_hours",
                    0,
                ),
                "available_window_hours": item.get(
                    "available_hours",
                    0,
                ),
                "utilization_percent": item.get(
                    "utilization_percent",
                    0,
                ),
                "opportunity_score": item.get(
                    "opportunity_score",
                    0,
                ),
                "conflict_status": item.get(
                    "conflict_status",
                    "Unknown",
                ),
                "handoff_status": "READY",
            }
        )

    total_planned_hours = sum(
        float(
            item.get(
                "duration_hours",
                0,
            )
        )
        for item in selected_opportunities
    )

    return {
        "status": "ready",
        "handoff_id": "BDMS-001",
        "generated_at": datetime.now().isoformat(
            timespec="seconds"
        ),
        "source": {
            "approval_id": approval.get(
                "approval_id"
            ),
            "approval_status": approval.get(
                "status"
            ),
            "reviewer": approval.get(
                "reviewer"
            ),
            "reviewed_at": approval.get(
                "reviewed_at"
            ),
        },
        "plan": {
            "solver_status": approval.get(
                "solver_status"
            ),
            "selected_blocks": len(
                selected_opportunities
            ),
            "planned_work_hours": total_planned_hours,
            "opportunity_value": approval.get(
                "summary",
                {},
            ).get(
                "total_opportunity_score",
                0,
            ),
        },
        "handoff_items": handoff_items,
        "destination": "BDMS",
        "integration_status": (
            "Prototype handoff package generated. "
            "No live BDMS connection is configured."
        ),
    }