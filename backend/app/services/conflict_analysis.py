from __future__ import annotations

from pathlib import Path

import pandas as pd

from app.services.joint_opportunity_detection import (
    detect_joint_opportunities,
)


PROJECT_ROOT = Path(__file__).resolve().parents[3]

OPERATIONAL_DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "operational_data"
    / "coa"
    / "operational_windows.csv"
)


def load_operational_windows() -> pd.DataFrame:
    """
    Load synthetic COA operational-window data used by
    RailSync AI conflict analysis.
    """

    frame = pd.read_csv(OPERATIONAL_DATA_PATH)

    frame["date"] = pd.to_datetime(
        frame["date"],
        errors="coerce",
    ).dt.date

    frame["available_hours"] = pd.to_numeric(
        frame["available_hours"],
        errors="coerce",
    ).fillna(0.0)

    frame["passenger_train_count"] = pd.to_numeric(
        frame["passenger_train_count"],
        errors="coerce",
    ).fillna(0).astype(int)

    frame["goods_train_count"] = pd.to_numeric(
        frame["goods_train_count"],
        errors="coerce",
    ).fillna(0).astype(int)

    frame["block_allowed"] = (
        frame["block_allowed"]
        .fillna(False)
        .astype(bool)
    )

    frame["traffic_level"] = (
        frame["traffic_level"]
        .fillna("Unknown")
        .astype(str)
    )

    frame["window_type"] = (
        frame["window_type"]
        .fillna("Unknown")
        .astype(str)
    )

    frame["window_id"] = (
        frame["window_id"]
        .fillna("")
        .astype(str)
    )

    return frame


def _safe_float(
    value: object,
    default: float = 0.0,
) -> float:
    """
    Safely convert a value to float.
    """

    try:
        if pd.isna(value):
            return default

        return float(value)

    except (TypeError, ValueError):
        return default


def _find_matching_window(
    opportunity: dict,
    windows: pd.DataFrame,
) -> pd.Series | None:
    """
    Find the exact COA operational window represented by
    the joint opportunity.
    """

    window_id = str(
        opportunity.get("window_id", "")
    ).strip()

    if not window_id:
        return None

    matches = windows[
        windows["window_id"] == window_id
    ]

    if matches.empty:
        return None

    return matches.iloc[0]


def _build_conflict_result(
    opportunity: dict,
    window: pd.Series | None,
) -> dict:
    """
    Apply transparent prototype conflict rules to one
    joint planning opportunity.

    Planning values come from the detected opportunity.
    Operational indicators such as traffic and train counts
    are validated against the matching COA window.
    """

    opportunity_id = str(
        opportunity.get("opportunity_id", "")
    )

    # ---------------------------------------------------------
    # AUTHORITATIVE PLANNING VALUES
    # ---------------------------------------------------------
    #
    # These values already belong to the detected opportunity.
    # Keep them intact instead of replacing them with defaults.
    #
    available_hours = _safe_float(
        opportunity.get("available_hours"),
    )

    required_hours = _safe_float(
        opportunity.get(
            "combined_duration_hours",
            opportunity.get("duration_hours"),
        ),
    )

    utilization_percent = _safe_float(
        opportunity.get("utilization_percent"),
    )

    opportunity_score = _safe_float(
        opportunity.get("opportunity_score"),
    )

    opportunity_traffic = str(
        opportunity.get(
            "traffic_level",
            "Unknown",
        )
    ).strip()

    opportunity_window_type = str(
        opportunity.get(
            "window_type",
            "Unknown",
        )
    ).strip()

    opportunity_window_id = str(
        opportunity.get(
            "window_id",
            "",
        )
    ).strip()

    # ---------------------------------------------------------
    # COA OPERATIONAL VALUES
    # ---------------------------------------------------------

    passenger_train_count = 0
    goods_train_count = 0

    block_allowed = False

    traffic_level = opportunity_traffic
    window_type = opportunity_window_type

    if window is not None:
        passenger_train_count = int(
            _safe_float(
                window.get(
                    "passenger_train_count",
                    0,
                )
            )
        )

        goods_train_count = int(
            _safe_float(
                window.get(
                    "goods_train_count",
                    0,
                )
            )
        )

        block_allowed = bool(
            window.get(
                "block_allowed",
                False,
            )
        )

        # COA is the authoritative source for these
        # operational indicators.
        traffic_level = str(
            window.get(
                "traffic_level",
                opportunity_traffic,
            )
        ).strip()

        window_type = str(
            window.get(
                "window_type",
                opportunity_window_type,
            )
        ).strip()

    conflicts: list[dict] = []

    # ---------------------------------------------------------
    # HARD CONFLICT: BLOCK NOT ALLOWED
    # ---------------------------------------------------------

    if not block_allowed:
        conflicts.append(
            {
                "code": "BLOCK_NOT_ALLOWED",
                "severity": "Critical",
                "message": (
                    "The selected operational window does "
                    "not allow a block."
                ),
            }
        )

    # ---------------------------------------------------------
    # HARD CONFLICT: INSUFFICIENT CAPACITY
    # ---------------------------------------------------------

    if required_hours > available_hours:
        conflicts.append(
            {
                "code": "INSUFFICIENT_WINDOW_CAPACITY",
                "severity": "Critical",
                "message": (
                    "Combined maintenance duration exceeds "
                    "the available block-window capacity."
                ),
            }
        )

    # ---------------------------------------------------------
    # CAPACITY PRESSURE
    # ---------------------------------------------------------

    if (
        required_hours <= available_hours
        and utilization_percent >= 90.0
    ):
        conflicts.append(
            {
                "code": "HIGH_WINDOW_UTILIZATION",
                "severity": "Medium",
                "message": (
                    "The proposed work uses most of the "
                    "available operational window."
                ),
            }
        )

    # ---------------------------------------------------------
    # PROTOTYPE TRAFFIC RULE
    # ---------------------------------------------------------

    daytime_restricted = window_type in {
        "Restricted Day Window",
        "Short Engineering Window",
    }

    if (
        traffic_level.lower() == "high"
        and daytime_restricted
    ):
        conflicts.append(
            {
                "code": "HIGH_TRAFFIC_DAY_WINDOW",
                "severity": "High",
                "message": (
                    "High traffic is associated with a "
                    "daytime or restricted operational window."
                ),
            }
        )

    # ---------------------------------------------------------
    # TRAIN ACTIVITY REVIEW
    # ---------------------------------------------------------

    total_train_count = (
        passenger_train_count
        + goods_train_count
    )

    if (
        total_train_count >= 15
        and traffic_level.lower() in {
            "high",
            "medium",
        }
    ):
        conflicts.append(
            {
                "code": "HIGH_TRAIN_ACTIVITY",
                "severity": "Medium",
                "message": (
                    "The selected window has relatively high "
                    "aggregate train activity."
                ),
            }
        )

    # ---------------------------------------------------------
    # DETERMINE OVERALL STATUS
    # ---------------------------------------------------------

    severities = {
        item["severity"]
        for item in conflicts
    }

    if "Critical" in severities:
        conflict_status = "Conflict"
        overall_severity = "Critical"
        can_proceed = False

        recommended_action = (
            "Do not propose this window without resolving "
            "the blocking operational constraint."
        )

    elif "High" in severities:
        conflict_status = "Review"
        overall_severity = "High"
        can_proceed = False

        recommended_action = (
            "Review traffic conditions and obtain operational "
            "approval before scheduling."
        )

    elif "Medium" in severities:
        conflict_status = "Review"
        overall_severity = "Medium"
        can_proceed = True

        recommended_action = (
            "Operational review recommended before final approval."
        )

    else:
        conflict_status = "Clear"
        overall_severity = "Low"
        can_proceed = True

        recommended_action = (
            "No operational conflict detected from the "
            "available synthetic indicators."
        )

    return {
        "opportunity_id": opportunity_id,

        "conflict_status": conflict_status,
        "severity": overall_severity,
        "can_proceed": can_proceed,
        "conflict_count": len(conflicts),
        "conflicts": conflicts,

        # Keep important planning values available to the
        # frontend and optimizer.
        "available_hours": available_hours,
        "required_hours": required_hours,
        "utilization_percent": utilization_percent,
        "opportunity_score": opportunity_score,

        "operational_indicators": {
            "traffic_level": traffic_level,
            "passenger_train_count": passenger_train_count,
            "goods_train_count": goods_train_count,
            "total_train_count": total_train_count,
            "block_allowed": block_allowed,
            "window_type": window_type,
            "available_hours": available_hours,
            "required_hours": required_hours,
            "utilization_percent": utilization_percent,
            "opportunity_score": opportunity_score,
        },

        "recommended_action": recommended_action,
    }


def analyze_conflicts() -> list[dict]:
    """
    Analyze all detected joint opportunities against the
    available synthetic COA operational constraints.
    """

    opportunities = detect_joint_opportunities()

    windows = load_operational_windows()

    results: list[dict] = []

    for opportunity in opportunities:
        window = _find_matching_window(
            opportunity,
            windows,
        )

        result = _build_conflict_result(
            opportunity,
            window,
        )

        # -----------------------------------------------------
        # PLANNING CONTEXT
        # -----------------------------------------------------

        result["section"] = str(
            opportunity.get(
                "section",
                "",
            )
        )

        result["date"] = str(
            opportunity.get(
                "date",
                "",
            )
        )

        result["window_id"] = str(
            opportunity.get(
                "window_id",
                "",
            )
        )

        result["window_type"] = str(
            opportunity.get(
                "window_type",
                "",
            )
        )

        result["request_ids"] = [
            str(request_id)
            for request_id in opportunity.get(
                "request_ids",
                [],
            )
        ]

        result["departments"] = [
            str(department)
            for department in opportunity.get(
                "departments",
                [],
            )
        ]

        result["activities"] = [
            str(activity)
            for activity in opportunity.get(
                "activities",
                [],
            )
        ]

        result["compatibility_reasons"] = [
            str(reason)
            for reason in opportunity.get(
                "compatibility_reasons",
                [],
            )
        ]

        results.append(result)

    # ---------------------------------------------------------
    # SORT BY OPERATIONAL IMPORTANCE
    # ---------------------------------------------------------

    severity_order = {
        "Critical": 0,
        "High": 1,
        "Medium": 2,
        "Low": 3,
    }

    status_order = {
        "Conflict": 0,
        "Review": 1,
        "Clear": 2,
    }

    results.sort(
        key=lambda item: (
            status_order.get(
                item["conflict_status"],
                9,
            ),
            severity_order.get(
                item["severity"],
                9,
            ),
            item["opportunity_id"],
        )
    )

    return results


def get_conflict_summary() -> dict:
    """
    Return a compact conflict-analysis summary.
    """

    results = analyze_conflicts()

    status_counts = {
        "clear": 0,
        "review": 0,
        "conflict": 0,
    }

    severity_counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
    }

    for result in results:
        status = result["conflict_status"].lower()

        if status in status_counts:
            status_counts[status] += 1

        severity = result["severity"].lower()

        if severity in severity_counts:
            severity_counts[severity] += 1

    return {
        "total_opportunities": len(results),
        "clear_opportunities": status_counts["clear"],
        "review_opportunities": status_counts["review"],
        "conflicting_opportunities": status_counts["conflict"],
        "critical_conflicts": severity_counts["critical"],
        "high_conflicts": severity_counts["high"],
        "medium_conflicts": severity_counts["medium"],
        "low_conflicts": severity_counts["low"],
    }