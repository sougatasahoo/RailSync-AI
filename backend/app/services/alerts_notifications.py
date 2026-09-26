from __future__ import annotations

from datetime import datetime
from typing import Any

from app.services.block_optimizer import optimize_block_plan
from app.services.conflict_analysis import analyze_conflicts
from app.services.maintenance_prioritization import (
    prioritize_maintenance_requests,
)
from app.services.resource_readiness import get_resource_readiness


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
        return number if number == number else default
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _text(value: Any, default: str = "") -> str:
    if value is None:
        return default

    text = str(value).strip()
    return text if text else default


def _alert(
    alert_id: str,
    title: str,
    description: str,
    severity: str,
    status: str,
    category: str,
    source: str,
    timestamp: str,
    affected_area: str,
    impact: str,
    action: str,
    target_page: str,
) -> dict[str, Any]:
    return {
        "id": alert_id,
        "title": title,
        "description": description,
        "severity": severity,
        "status": status,
        "category": category,
        "source": source,
        "timestamp": timestamp,
        "affectedArea": affected_area,
        "impact": impact,
        "action": action,
        "targetPage": target_page,
    }


def _build_resource_alerts() -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []

    readiness = get_resource_readiness()

    resources = readiness.get("resources", [])
    unavailable = []
    limited = []

    for resource in resources:
        status = _text(resource.get("status"))

        if status.lower() == "unavailable":
            unavailable.append(resource)

        elif status.lower() == "limited":
            limited.append(resource)

    if unavailable:
        resource = unavailable[0]

        alerts.append(
            _alert(
                alert_id="ALT-R001",
                title="Resource unavailable",
                description=(
                    f"{_text(resource.get('resource_name'), 'A required resource')} "
                    "is currently unavailable."
                ),
                severity="Critical",
                status="Pending",
                category="Resource",
                source="Resource Readiness",
                timestamp=datetime.now().strftime("%H:%M"),
                affected_area=_text(
                    resource.get("location"),
                    "Kharagpur Division",
                ),
                impact=(
                    "The resource may prevent or delay execution of "
                    "planned maintenance activity."
                ),
                action=(
                    "Review resource availability and assign an "
                    "alternate resource if required."
                ),
                target_page="Resource Readiness",
            )
        )

    if limited:
        resource = limited[0]

        alerts.append(
            _alert(
                alert_id="ALT-R002",
                title="Limited resource availability",
                description=(
                    f"{_text(resource.get('resource_name'), 'A resource')} "
                    "has limited current availability."
                ),
                severity="Medium",
                status="Pending",
                category="Resource",
                source="Resource Readiness",
                timestamp=datetime.now().strftime("%H:%M"),
                affected_area=_text(
                    resource.get("location"),
                    "Kharagpur Division",
                ),
                impact=(
                    "Resource assignment may need adjustment before "
                    "final block approval."
                ),
                action=(
                    "Review resource readiness before finalizing "
                    "the block plan."
                ),
                target_page="Resource Readiness",
            )
        )

    return alerts


def _build_maintenance_alerts() -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []

    records = prioritize_maintenance_requests()

    high_priority = [
        record
        for record in records
        if _text(record.get("priority_category")).lower()
        in {"critical", "high"}
    ]

    if high_priority:
        request = high_priority[0]

        request_id = _text(
            request.get("request_id"),
            "maintenance request",
        )

        priority = _text(
            request.get("priority_category"),
            "High",
        )

        alerts.append(
            _alert(
                alert_id="ALT-M001",
                title="High-priority maintenance request",
                description=(
                    f"{request_id} has been identified as a "
                    f"{priority.lower()} priority request."
                ),
                severity=(
                    "Critical"
                    if priority.lower() == "critical"
                    else "High"
                ),
                status="Pending",
                category="Maintenance",
                source=_text(
                    request.get("source_system"),
                    "Maintenance Intelligence",
                ),
                timestamp=datetime.now().strftime("%H:%M"),
                affected_area=_text(
                    request.get("location"),
                    _text(request.get("section"), "Railway section"),
                ),
                impact=(
                    "Delayed maintenance may increase operational "
                    "risk or maintenance backlog."
                ),
                action=(
                    "Review the request and evaluate its inclusion "
                    "in the next planning cycle."
                ),
                target_page="Maintenance Requests",
            )
        )

    return alerts


def _build_conflict_alerts() -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []

    conflicts = analyze_conflicts()

    critical_conflicts = [
        item
        for item in conflicts
        if _text(item.get("conflict_level")).lower() == "critical"
        or _text(item.get("status")).lower() == "conflict"
    ]

    review_conflicts = [
        item
        for item in conflicts
        if _text(item.get("status")).lower() == "review"
    ]

    if critical_conflicts:
        conflict = critical_conflicts[0]

        alerts.append(
            _alert(
                alert_id="ALT-B001",
                title="Critical block conflict detected",
                description=(
                    "A proposed maintenance opportunity contains "
                    "a critical operational conflict."
                ),
                severity="Critical",
                status="Pending",
                category="Block Planning",
                source="Conflict Analysis",
                timestamp=datetime.now().strftime("%H:%M"),
                affected_area=_text(
                    conflict.get("section"),
                    "Operational section",
                ),
                impact=(
                    "The proposed opportunity should not proceed "
                    "without resolving the conflict."
                ),
                action=(
                    "Open Block Planning and review the conflict "
                    "before approval."
                ),
                target_page="Block Planning",
            )
        )

    elif review_conflicts:
        conflict = review_conflicts[0]

        alerts.append(
            _alert(
                alert_id="ALT-B002",
                title="Block planning review required",
                description=(
                    "A proposed maintenance opportunity requires "
                    "operational review before final approval."
                ),
                severity="Medium",
                status="Pending",
                category="Block Planning",
                source="Conflict Analysis",
                timestamp=datetime.now().strftime("%H:%M"),
                affected_area=_text(
                    conflict.get("section"),
                    "Operational section",
                ),
                impact=(
                    "The opportunity may require additional "
                    "operational review before approval."
                ),
                action=(
                    "Open Block Planning and review the proposed "
                    "opportunity."
                ),
                target_page="Block Planning",
            )
        )

    return alerts


def _build_planning_alerts() -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []

    plan = optimize_block_plan()
    summary = plan.get("summary", {})

    selected = _safe_int(summary.get("selected_count"))
    unscheduled = _safe_int(summary.get("unscheduled_count"))

    if selected > 0:
        alerts.append(
            _alert(
                alert_id="ALT-P001",
                title="Block plan ready for review",
                description=(
                    f"The optimizer selected {selected} "
                    "joint maintenance opportunities for the proposed plan."
                ),
                severity="Medium",
                status="Acknowledged",
                category="Block Planning",
                source="RailSync AI",
                timestamp=datetime.now().strftime("%H:%M"),
                affected_area="Kharagpur Division",
                impact=(
                    "Human review is required before the proposed "
                    "plan can proceed to downstream handoff."
                ),
                action=(
                    "Open Block Planning and review the proposed "
                    "plan."
                ),
                target_page="Block Planning",
            )
        )

    if unscheduled > 0:
        alerts.append(
            _alert(
                alert_id="ALT-P002",
                title="Maintenance opportunities remain unscheduled",
                description=(
                    f"{unscheduled} identified joint opportunities "
                    "were not selected in the current optimization run."
                ),
                severity="Info",
                status="Acknowledged",
                category="Block Planning",
                source="Block Optimizer",
                timestamp=datetime.now().strftime("%H:%M"),
                affected_area="Kharagpur Division",
                impact=(
                    "Some maintenance opportunities remain outside "
                    "the current proposed plan."
                ),
                action=(
                    "Review unscheduled opportunities when planning "
                    "the next block cycle."
                ),
                target_page="Block Planning",
            )
        )

    return alerts


def _build_system_alert() -> dict[str, Any]:
    return _alert(
        alert_id="ALT-S001",
        title="RailSync AI data processing active",
        description=(
            "Current notification data has been generated from "
            "the latest available synthetic operational datasets."
        ),
        severity="Info",
        status="Resolved",
        category="System",
        source="Data Fusion",
        timestamp=datetime.now().strftime("%H:%M"),
        affected_area="RailSync AI Platform",
        impact="No operational impact.",
        action="No action required.",
        target_page="Operations Overview",
    )


def get_alerts() -> dict[str, Any]:
    alerts: list[dict[str, Any]] = []

    alerts.extend(_build_resource_alerts())
    alerts.extend(_build_maintenance_alerts())
    alerts.extend(_build_conflict_alerts())
    alerts.extend(_build_planning_alerts())

    alerts.append(_build_system_alert())

    severity_order = {
        "Critical": 0,
        "High": 1,
        "Medium": 2,
        "Info": 3,
    }

    alerts.sort(
        key=lambda item: (
            severity_order.get(
                _text(item.get("severity")),
                9,
            ),
            _text(item.get("id")),
        )
    )

    return {
        "status": "success",
        "total_alerts": len(alerts),
        "alerts": alerts,
    }


def get_alert_summary() -> dict[str, Any]:
    result = get_alerts()

    alerts = result.get("alerts", [])

    return {
        "status": "success",
        "total_alerts": len(alerts),
        "critical": sum(
            1
            for alert in alerts
            if alert.get("severity") == "Critical"
            and alert.get("status") != "Resolved"
        ),
        "high": sum(
            1
            for alert in alerts
            if alert.get("severity") == "High"
            and alert.get("status") != "Resolved"
        ),
        "medium": sum(
            1
            for alert in alerts
            if alert.get("severity") == "Medium"
            and alert.get("status") != "Resolved"
        ),
        "info": sum(
            1
            for alert in alerts
            if alert.get("severity") == "Info"
        ),
        "pending": sum(
            1
            for alert in alerts
            if alert.get("status") == "Pending"
        ),
        "acknowledged": sum(
            1
            for alert in alerts
            if alert.get("status") == "Acknowledged"
        ),
        "resolved": sum(
            1
            for alert in alerts
            if alert.get("status") == "Resolved"
        ),
    }