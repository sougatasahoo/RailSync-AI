from __future__ import annotations

import random
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

from config.railway_config import (
    DEFAULT_SEED,
    MAINTENANCE_DATA_DIR,
    TMS_REQUESTS_PER_DAY,
    TMS_RESOURCES,
    TMS_DEFECT_TYPES,
)


# ============================================================
# SYNTHETIC TMS LOCATION MODEL
# ============================================================

SECTIONS = [
    {
        "section": "Howrah–Santragachi",
        "code": "HWH–SRC",
        "start_km": 0.0,
        "end_km": 12.0,
    },
    {
        "section": "Santragachi–Panskura",
        "code": "SRC–PKU",
        "start_km": 12.0,
        "end_km": 115.0,
    },
    {
        "section": "Mecheda–Panskura",
        "code": "MCA–PKU",
        "start_km": 115.0,
        "end_km": 125.0,
    },
    {
        "section": "Panskura–Kharagpur",
        "code": "PKU–KGP",
        "start_km": 125.0,
        "end_km": 170.0,
    },
    {
        "section": "Kharagpur–Gidni",
        "code": "KGP–GID",
        "start_km": 170.0,
        "end_km": 215.0,
    },
]


# ============================================================
# GENERATION HELPERS
# ============================================================

def weighted_priority(rng: random.Random) -> str:
    """
    Synthetic priority distribution.

    Critical and High jobs are intentionally less frequent
    than Medium and Low jobs.
    """

    return rng.choices(
        ["Critical", "High", "Medium", "Low"],
        weights=[5, 20, 45, 30],
        k=1,
    )[0]


def choose_defect(rng: random.Random) -> str:
    return rng.choice(TMS_DEFECT_TYPES)


def choose_section(rng: random.Random) -> dict:
    return rng.choice(SECTIONS)


def choose_resource(defect_type: str, rng: random.Random) -> str:
    if defect_type in {
        "Track geometry defect",
        "Rail defect",
        "Sleeper defect",
        "Ballast issue",
        "Track wear",
    }:
        return rng.choice(
            [
                "Track Machine",
                "Track Gang",
            ]
        )

    if defect_type == "USFD-related inspection":
        return "Track Inspection Team"

    return rng.choice(TMS_RESOURCES)


def duration_for_defect(
    defect_type: str,
    priority: str,
    rng: random.Random,
) -> int:
    """
    Generate a realistic-looking maintenance duration.

    Critical defects are not automatically given the longest
    duration; urgency and work complexity are separate concepts.
    """

    ranges = {
        "Track geometry defect": (60, 120),
        "Rail defect": (90, 180),
        "Sleeper defect": (60, 150),
        "Ballast issue": (60, 180),
        "Track wear": (60, 120),
        "USFD-related inspection": (45, 90),
        "Preventive track maintenance": (45, 120),
    }

    low, high = ranges.get(
        defect_type,
        (60, 120),
    )

    duration = rng.randint(low, high)

    if priority == "Critical":
        duration = max(45, int(duration * 0.85))

    return duration


def choose_scenario(
    priority: str,
    rng: random.Random,
) -> str:
    """
    Scenario labels are synthetic planning scenarios.
    """

    if priority == "Critical":
        return rng.choices(
            [
                "critical_defect",
                "high_conflict",
                "mixed_realistic",
            ],
            weights=[60, 15, 25],
            k=1,
        )[0]

    return rng.choices(
        [
            "normal",
            "high_defect_load",
            "cross_department_cluster",
            "mixed_realistic",
        ],
        weights=[55, 10, 15, 20],
        k=1,
    )[0]


def calculate_due_date(
    request_date: date,
    priority: str,
    rng: random.Random,
) -> date:

    days_until_due = {
        "Critical": rng.randint(0, 1),
        "High": rng.randint(0, 3),
        "Medium": rng.randint(2, 7),
        "Low": rng.randint(5, 14),
    }

    return request_date + timedelta(
        days=days_until_due[priority]
    )


# ============================================================
# MAIN GENERATOR
# ============================================================

def generate_tms_requests(
    days: int = 30,
    requests_per_day: int = TMS_REQUESTS_PER_DAY,
    seed: int = DEFAULT_SEED,
) -> pd.DataFrame:

    rng = random.Random(seed)

    start_date = date.today()

    records: list[dict] = []

    sequence = 1

    for day_offset in range(days):

        request_date = start_date + timedelta(
            days=day_offset
        )

        for _ in range(requests_per_day):

            section = choose_section(rng)

            defect_type = choose_defect(rng)

            priority = weighted_priority(rng)

            scenario = choose_scenario(
                priority,
                rng,
            )

            # ------------------------------------------------
            # KM location
            # ------------------------------------------------
            km = round(
                rng.uniform(
                    section["start_km"],
                    section["end_km"],
                ),
                1,
            )

            # ------------------------------------------------
            # Create some clustered maintenance locations.
            #
            # These repeated locations are important because
            # TDMS/SMMS generators will later create jobs near
            # the same areas for joint-opportunity detection.
            # ------------------------------------------------
            if rng.random() < 0.12:

                cluster_centres = [
                    118.2,
                    142.5,
                    158.0,
                    164.3,
                ]

                km = round(
                    rng.choice(cluster_centres)
                    + rng.uniform(-0.4, 0.4),
                    1,
                )

                km = max(
                    section["start_km"],
                    min(km, section["end_km"]),
                )

                scenario = "cross_department_cluster"

            duration = duration_for_defect(
                defect_type,
                priority,
                rng,
            )

            resource = choose_resource(
                defect_type,
                rng,
            )

            due_date = calculate_due_date(
                request_date,
                priority,
                rng,
            )

            # Synthetic estimated risk score.
            severity_score = {
                "Critical": rng.randint(85, 100),
                "High": rng.randint(65, 84),
                "Medium": rng.randint(40, 64),
                "Low": rng.randint(15, 39),
            }[priority]

            request_id = (
                f"TRK-26027-{sequence:05d}"
            )

            records.append(
                {
                    "request_id": request_id,
                    "request_date": request_date.isoformat(),
                    "department": "TMS",
                    "section": section["section"],
                    "section_code": section["code"],
                    "km": km,
                    "defect_type": defect_type,
                    "priority": priority,
                    "severity_score": severity_score,
                    "duration_minutes": duration,
                    "required_resource": resource,
                    "due_date": due_date.isoformat(),
                    "scenario": scenario,
                    "status": "Pending",
                }
            )

            sequence += 1

    return pd.DataFrame(records)


# ============================================================
# SAVE FUNCTION
# ============================================================

def save_tms_requests(
    dataframe: pd.DataFrame,
) -> Path:

    output_directory = (
        MAINTENANCE_DATA_DIR / "TMS"
    )

    output_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        output_directory
        / "tms_requests.csv"
    )

    dataframe.to_csv(
        output_path,
        index=False,
    )

    return output_path


# ============================================================
# COMMAND-LINE EXECUTION
# ============================================================

if __name__ == "__main__":

    data = generate_tms_requests()

    path = save_tms_requests(data)

    print(
        "TMS dataset generated successfully."
    )

    print(
        f"Rows: {len(data)}"
    )

    print(
        f"Output: {path}"
    )

    print(
        "\nPriority distribution:"
    )

    print(
        data["priority"]
        .value_counts()
        .to_string()
    )

    print(
        "\nDepartment:"
    )

    print(
        data["department"]
        .value_counts()
        .to_string()
    )