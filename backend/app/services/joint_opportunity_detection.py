from __future__ import annotations

from itertools import combinations
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[3]

COA_PATH = (
    PROJECT_ROOT
    / "data"
    / "operational_data"
    / "coa"
    / "operational_windows.csv"
)

MAINTENANCE_SOURCES = [
    (
        "TMS",
        PROJECT_ROOT
        / "data"
        / "maintenance_data"
        / "tms"
        / "maintenance_requests.csv",
    ),
    (
        "SMMS",
        PROJECT_ROOT
        / "data"
        / "maintenance_data"
        / "smms"
        / "maintenance_requests.csv",
    ),
    (
        "TDMS",
        PROJECT_ROOT
        / "data"
        / "maintenance_data"
        / "tdms"
        / "maintenance_requests.csv",
    ),
]


def _load_maintenance_requests() -> pd.DataFrame:
    frames: list[pd.DataFrame] = []

    for department, path in MAINTENANCE_SOURCES:
        if not path.exists():
            continue

        frame = pd.read_csv(path)

        if frame.empty:
            continue

        # The department is determined by the source dataset.
        frame["source_system"] = department

        frames.append(frame)

    if not frames:
        raise FileNotFoundError(
            "No maintenance request datasets were found."
        )

    maintenance = pd.concat(
        frames,
        ignore_index=True,
    )

    maintenance["reported_date"] = pd.to_datetime(
        maintenance["reported_date"],
        errors="coerce",
    )

    maintenance["due_date"] = pd.to_datetime(
        maintenance["due_date"],
        errors="coerce",
    )

    maintenance["estimated_duration_hours"] = pd.to_numeric(
        maintenance["estimated_duration_hours"],
        errors="coerce",
    ).fillna(0)

    maintenance["required_manpower"] = pd.to_numeric(
        maintenance["required_manpower"],
        errors="coerce",
    ).fillna(0)

    maintenance["block_required"] = (
        maintenance["block_required"]
        .fillna(False)
        .astype(bool)
    )

    for column in [
        "request_id",
        "activity",
        "source_system",
        "location",
        "section",
        "priority",
        "status",
        "required_machine",
        "required_materials",
    ]:
        if column not in maintenance.columns:
            maintenance[column] = ""

        maintenance[column] = (
            maintenance[column]
            .fillna("")
            .astype(str)
        )

    return maintenance


def _load_operational_windows() -> pd.DataFrame:
    if not COA_PATH.exists():
        raise FileNotFoundError(
            f"COA operational dataset not found: {COA_PATH}"
        )

    windows = pd.read_csv(COA_PATH)

    if windows.empty:
        return windows

    windows["date"] = pd.to_datetime(
        windows["date"],
        errors="coerce",
    )

    windows["available_hours"] = pd.to_numeric(
        windows["available_hours"],
        errors="coerce",
    ).fillna(0)

    windows["passenger_train_count"] = pd.to_numeric(
        windows["passenger_train_count"],
        errors="coerce",
    ).fillna(0)

    windows["goods_train_count"] = pd.to_numeric(
        windows["goods_train_count"],
        errors="coerce",
    ).fillna(0)

    windows["block_allowed"] = (
        windows["block_allowed"]
        .fillna(False)
        .astype(bool)
    )

    for column in [
        "window_id",
        "section",
        "location",
        "start_time",
        "end_time",
        "window_type",
        "traffic_level",
        "notes",
    ]:
        if column not in windows.columns:
            windows[column] = ""

        windows[column] = (
            windows[column]
            .fillna("")
            .astype(str)
        )

    return windows


def _priority_weight(priority: str) -> float:
    weights = {
        "Critical": 1.00,
        "High": 0.80,
        "Medium": 0.55,
        "Low": 0.30,
    }

    return weights.get(priority, 0.40)


def _calculate_compatibility(
    first: pd.Series,
    second: pd.Series,
) -> tuple[bool, list[str]]:
    reasons: list[str] = []

    same_section = (
        str(first["section"]).strip().lower()
        == str(second["section"]).strip().lower()
    )

    if same_section:
        reasons.append("Same operational section")

    same_date = (
        first["due_date"].date()
        == second["due_date"].date()
    )

    if same_date:
        reasons.append("Same due date")

    both_need_block = (
        bool(first["block_required"])
        and bool(second["block_required"])
    )

    if both_need_block:
        reasons.append(
            "Both activities require a block"
        )

    machine_first = str(
        first["required_machine"]
    ).strip().lower()

    machine_second = str(
        second["required_machine"]
    ).strip().lower()

    machine_compatible = (
        not machine_first
        or not machine_second
        or machine_first == machine_second
    )

    if machine_compatible:
        reasons.append(
            "Machine requirements are compatible"
        )

    compatible = (
        same_section
        and same_date
        and both_need_block
        and machine_compatible
    )

    return compatible, reasons


def _find_matching_window(
    request: pd.Series,
    windows: pd.DataFrame,
) -> pd.Series | None:
    if windows.empty:
        return None

    request_date = request["due_date"]

    candidates = windows[
        windows["date"].dt.date
        == request_date.date()
    ]

    if candidates.empty:
        candidates = windows[
            windows["date"].dt.date
            >= request_date.date()
        ]

    if candidates.empty:
        return None

    request_section = (
        str(request["section"])
        .strip()
        .lower()
    )

    same_section = candidates[
        candidates["section"]
        .str.strip()
        .str.lower()
        == request_section
    ]

    if not same_section.empty:
        candidates = same_section

    allowed = candidates[
        candidates["block_allowed"]
        & (
            candidates["available_hours"]
            >= float(
                request[
                    "estimated_duration_hours"
                ]
            )
        )
    ]

    if allowed.empty:
        return None

    return allowed.sort_values(
        "available_hours"
    ).iloc[0]


def detect_joint_opportunities() -> list[dict]:
    maintenance = _load_maintenance_requests()
    windows = _load_operational_windows()

    if maintenance.empty:
        return []

    candidates = maintenance[
        maintenance["block_required"]
        & maintenance["due_date"].notna()
        & (
            maintenance["estimated_duration_hours"]
            > 0
        )
    ].copy()

    opportunities: list[dict] = []

    for first, second in combinations(
        candidates.to_dict("records"),
        2,
    ):
        first_series = pd.Series(first)
        second_series = pd.Series(second)

        compatible, reasons = _calculate_compatibility(
            first_series,
            second_series,
        )

        if not compatible:
            continue

        total_duration = (
            float(
                first[
                    "estimated_duration_hours"
                ]
            )
            + float(
                second[
                    "estimated_duration_hours"
                ]
            )
        )

        matching_window = _find_matching_window(
            first_series,
            windows,
        )

        if matching_window is None:
            continue

        available_hours = float(
            matching_window["available_hours"]
        )

        if total_duration > available_hours:
            continue

        departments = sorted(
            {
                str(first["source_system"]),
                str(second["source_system"]),
            }
        )

        priority_score = round(
            (
                _priority_weight(
                    str(first["priority"])
                )
                + _priority_weight(
                    str(second["priority"])
                )
            )
            * 50,
            2,
        )

        utilization = round(
            (
                total_duration
                / available_hours
            )
            * 100,
            1,
        )

        # Combining two activities into one block
        # avoids planning two separate access windows.
        resource_saving = 50.0

        opportunity_score = round(
            (
                priority_score * 0.40
                + min(utilization, 100) * 0.35
                + len(departments) * 10 * 0.25
            ),
            2,
        )

        opportunities.append(
            {
                "opportunity_id": (
                    f"JO-{len(opportunities) + 1:03d}"
                ),
                "request_ids": [
                    first["request_id"],
                    second["request_id"],
                ],
                "activities": [
                    first["activity"],
                    second["activity"],
                ],
                "departments": departments,
                "section": first["section"],
                "date": (
                    matching_window["date"]
                    .strftime("%Y-%m-%d")
                ),
                "window_id": matching_window[
                    "window_id"
                ],
                "window_type": matching_window[
                    "window_type"
                ],
                "available_hours": round(
                    available_hours,
                    2,
                ),
                "combined_duration_hours": round(
                    total_duration,
                    2,
                ),
                "utilization_percent": utilization,
                "opportunity_score": opportunity_score,
                "compatibility_reasons": reasons,
                "resource_saving_percent": resource_saving,
                "traffic_level": matching_window[
                    "traffic_level"
                ],
                "block_feasible": True,
            }
        )

    opportunities.sort(
        key=lambda item: (
            -item["opportunity_score"],
            item["date"],
            item["section"],
        )
    )

    return opportunities


def get_joint_opportunity_summary() -> dict:
    opportunities = detect_joint_opportunities()

    sections = sorted(
        {
            opportunity["section"]
            for opportunity in opportunities
        }
    )

    departments = sorted(
        {
            department
            for opportunity in opportunities
            for department in opportunity[
                "departments"
            ]
        }
    )

    return {
        "total_opportunities": len(opportunities),
        "sections_with_opportunities": len(sections),
        "sections": sections,
        "departments_involved": departments,
        "top_opportunity": (
            opportunities[0]["opportunity_id"]
            if opportunities
            else None
        ),
    }