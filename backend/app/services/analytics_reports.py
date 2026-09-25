from __future__ import annotations

from collections import defaultdict
from typing import Any

from app.services.block_optimizer import optimize_block_plan
from app.services.conflict_analysis import analyze_conflicts
from app.services.joint_opportunity_detection import (
    detect_joint_opportunities,
)
from app.services.maintenance_prioritization import (
    prioritize_maintenance_requests,
)
from app.services.resource_readiness import (
    get_resource_readiness,
)


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        number = float(value)

        if number != number:
            return default

        return number

    except (TypeError, ValueError):
        return default


def _safe_int(
    value: Any,
    default: int = 0,
) -> int:
    try:
        return int(float(value))

    except (TypeError, ValueError):
        return default


def _percentage(
    numerator: float,
    denominator: float,
) -> float:
    if denominator <= 0:
        return 0.0

    return round(
        (numerator / denominator) * 100.0,
        1,
    )


def _maintenance_records() -> list[dict]:
    records = prioritize_maintenance_requests()

    if not isinstance(records, list):
        return []

    return records


def _joint_opportunities() -> list[dict]:
    records = detect_joint_opportunities()

    if not isinstance(records, list):
        return []

    return records


def _conflicts() -> list[dict]:
    records = analyze_conflicts()

    if not isinstance(records, list):
        return []

    return records


def _build_department_performance(
    maintenance: list[dict],
) -> list[dict]:
    department_data: dict[
        str,
        dict[str, int],
    ] = defaultdict(
        lambda: {
            "requests": 0,
            "completed": 0,
        }
    )

    for record in maintenance:
        department = str(
            record.get(
                "source_system",
                record.get(
                    "department",
                    "Unknown",
                ),
            )
        ).upper()

        if not department:
            department = "Unknown"

        department_data[department]["requests"] += 1

        status = str(
            record.get(
                "status",
                "",
            )
        ).strip().lower()

        if status in {
            "completed",
            "closed",
            "done",
            "resolved",
        }:
            department_data[department]["completed"] += 1

    result = []

    for department, values in sorted(
        department_data.items()
    ):
        requests = values["requests"]
        completed = values["completed"]

        result.append(
            {
                "name": department,
                "requests": requests,
                "completed": completed,
                "completion_percent": _percentage(
                    completed,
                    requests,
                ),
            }
        )

    return result


def _calculate_block_utilization(
    opportunities: list[dict],
) -> float:
    if not opportunities:
        return 0.0

    total_available = sum(
        _safe_float(
            opportunity.get(
                "available_hours",
                0,
            )
        )
        for opportunity in opportunities
    )

    total_required = sum(
        _safe_float(
            opportunity.get(
                "combined_duration_hours",
                opportunity.get(
                    "duration_hours",
                    0,
                ),
            )
        )
        for opportunity in opportunities
    )

    return _percentage(
        total_required,
        total_available,
    )


def _build_utilization_trend(
    opportunities: list[dict],
) -> list[dict]:
    by_date: dict[
        str,
        list[dict],
    ] = defaultdict(list)

    for opportunity in opportunities:
        date = str(
            opportunity.get(
                "date",
                "",
            )
        )

        if date:
            by_date[date].append(
                opportunity
            )

    trend = []

    for date, records in sorted(
        by_date.items()
    ):
        available = sum(
            _safe_float(
                record.get(
                    "available_hours",
                    0,
                )
            )
            for record in records
        )

        required = sum(
            _safe_float(
                record.get(
                    "combined_duration_hours",
                    record.get(
                        "duration_hours",
                        0,
                    ),
                )
            )
            for record in records
        )

        utilization = _percentage(
            required,
            available,
        )

        trend.append(
            {
                "label": date,
                "value": utilization,
            }
        )

    return trend


def _build_recent_outcomes(
    optimized_plan: dict,
) -> list[dict]:
    selected = optimized_plan.get(
        "selected_opportunities",
        [],
    )

    if not isinstance(
        selected,
        list,
    ):
        return []

    outcomes = []

    for item in selected:
        request_ids = item.get(
            "request_ids",
            [],
        )

        if not isinstance(
            request_ids,
            list,
        ):
            request_ids = []

        outcomes.append(
            {
                "id": str(
                    item.get(
                        "opportunity_id",
                        "",
                    )
                ),
                "activity": (
                    "Joint Maintenance "
                    "Opportunity"
                ),
                "corridor": str(
                    item.get(
                        "section",
                        "Unknown section",
                    )
                ),
                "date": str(
                    item.get(
                        "date",
                        "",
                    )
                ),
                "requests": len(
                    request_ids
                ),
                "duration": _safe_float(
                    item.get(
                        "duration_hours",
                        0,
                    )
                ),
                "utilization": _safe_float(
                    item.get(
                        "utilization_percent",
                        0,
                    )
                ),
                "status": str(
                    item.get(
                        "conflict_status",
                        "Proposed",
                    )
                ),
            }
        )

    return outcomes


def get_analytics_report() -> dict:
    maintenance = _maintenance_records()
    opportunities = _joint_opportunities()
    conflicts = _conflicts()
    resource_data = get_resource_readiness()
    optimized_plan = optimize_block_plan()

    total_maintenance = len(
        maintenance
    )

    completed_maintenance = sum(
        1
        for record in maintenance
        if str(
            record.get(
                "status",
                "",
            )
        ).strip().lower()
        in {
            "completed",
            "closed",
            "done",
            "resolved",
        }
    )

    block_utilization = (
        _calculate_block_utilization(
            opportunities
        )
    )

    selected_opportunities = (
        optimized_plan.get(
            "selected_opportunities",
            [],
        )
    )

    if not isinstance(
        selected_opportunities,
        list,
    ):
        selected_opportunities = []

    optimizer_summary = (
        optimized_plan.get(
            "summary",
            {},
        )
    )

    if not isinstance(
        optimizer_summary,
        dict,
    ):
        optimizer_summary = {}

    candidate_count = _safe_int(
        optimizer_summary.get(
            "candidate_count",
            len(opportunities),
        )
    )

    selected_count = len(
        selected_opportunities
    )

    unscheduled_count = max(
        0,
        candidate_count - selected_count,
    )

    conflict_review_count = sum(
        1
        for conflict in conflicts
        if str(
            conflict.get(
                "status",
                "",
            )
        ).lower()
        == "review"
    )

    readiness = _safe_float(
        resource_data.get(
            "overall_readiness",
            0,
        )
    )

    department_performance = (
        _build_department_performance(
            maintenance
        )
    )

    utilization_trend = (
        _build_utilization_trend(
            opportunities
        )
    )

    recent_outcomes = (
        _build_recent_outcomes(
            optimized_plan
        )
    )

    total_available_hours = sum(
        _safe_float(
            opportunity.get(
                "available_hours",
                0,
            )
        )
        for opportunity in opportunities
    )

    total_planned_hours = _safe_float(
        optimizer_summary.get(
            "total_planned_hours",
            0,
        )
    )

    total_opportunity_score = _safe_float(
        optimizer_summary.get(
            "total_opportunity_score",
            0,
        )
    )

    return {
        "status": "success",
        "summary": {
            "block_utilization": (
                block_utilization
            ),
            "maintenance_total": (
                total_maintenance
            ),
            "maintenance_completed": (
                completed_maintenance
            ),
            "joint_opportunities": len(
                opportunities
            ),
            "selected_opportunities": (
                selected_count
            ),
            "unscheduled_opportunities": (
                unscheduled_count
            ),
            "resource_readiness": (
                readiness
            ),
            "conflict_reviews": (
                conflict_review_count
            ),
            "total_available_hours": round(
                total_available_hours,
                1,
            ),
            "total_planned_hours": round(
                total_planned_hours,
                1,
            ),
            "total_opportunity_score": round(
                total_opportunity_score,
                2,
            ),
        },
        "utilization_trend": (
            utilization_trend
        ),
        "department_performance": (
            department_performance
        ),
        "recent_outcomes": (
            recent_outcomes
        ),
        "resource_summary": (
            resource_data.get(
                "summary",
                {},
            )
        ),
        "planning_summary": (
            optimizer_summary
        ),
        "conflict_summary": {
            "total": len(conflicts),
            "review": (
                conflict_review_count
            ),
            "clear": sum(
                1
                for conflict in conflicts
                if str(
                    conflict.get(
                        "status",
                        "",
                    )
                ).lower()
                == "clear"
            ),
        },
    }


def get_analytics_summary() -> dict:
    result = get_analytics_report()

    return {
        "status": result["status"],
        **result["summary"],
    }