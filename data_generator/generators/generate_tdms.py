from __future__ import annotations

import random
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

from config.railway_config import (
    DEFAULT_SEED,
    MAINTENANCE_DATA_DIR,
    TDMS_REQUESTS_PER_DAY,
    TDMS_RESOURCES,
    TDMS_DEFECT_TYPES,
)


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


CLUSTER_LOCATIONS = [
    (118.2, "MCA–PKU"),
    (142.5, "PKU–KGP"),
    (158.0, "PKU–KGP"),
    (164.3, "PKU–KGP"),
]


def weighted_priority(rng: random.Random) -> str:
    return rng.choices(
        ["Critical", "High", "Medium", "Low"],
        weights=[5, 20, 45, 30],
        k=1,
    )[0]


def choose_section(rng: random.Random) -> dict:
    return rng.choice(SECTIONS)


def choose_defect(rng: random.Random) -> str:
    return rng.choice(TDMS_DEFECT_TYPES)


def choose_resource(
    defect_type: str,
    rng: random.Random,
) -> str:

    if defect_type in {
        "Contact wire inspection",
        "OHE defect",
        "Insulator replacement",
        "Pantograph interaction issue",
    }:
        return rng.choice(
            [
                "OHE Crew",
                "OHE Tower Wagon",
            ]
        )

    if defect_type == "Traction substation inspection":
        return "Traction Maintenance Team"

    if defect_type == "Sectioning equipment inspection":
        return "Electrical Inspection Team"

    return rng.choice(TDMS_RESOURCES)


def duration_for_defect(
    defect_type: str,
    priority: str,
    rng: random.Random,
) -> int:

    ranges = {
        "OHE defect": (60, 150),
        "Contact wire inspection": (60, 120),
        "Insulator replacement": (45, 90),
        "Pantograph interaction issue": (60, 120),
        "Sectioning equipment inspection": (60, 120),
        "Traction substation inspection": (90, 180),
        "Preventive OHE maintenance": (45, 120),
    }

    low, high = ranges.get(
        defect_type,
        (60, 120),
    )

    duration = rng.randint(low, high)

    if priority == "Critical":
        duration = max(
            45,
            int(duration * 0.85),
        )

    return duration


def choose_scenario(
    priority: str,
    rng: random.Random,
) -> str:

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
        weights=[55, 10, 20, 15],
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


def choose_location(
    rng: random.Random,
) -> tuple[dict, float, str]:

    if rng.random() < 0.16:

        km, section_code = rng.choice(
            CLUSTER_LOCATIONS
        )

        section = next(
            section
            for section in SECTIONS
            if section["code"] == section_code
        )

        km = round(
            km + rng.uniform(-0.35, 0.35),
            1,
        )

        return section, km, "cross_department_cluster"

    section = choose_section(rng)

    km = round(
        rng.uniform(
            section["start_km"],
            section["end_km"],
        ),
        1,
    )

    return section, km, "normal"


def generate_tdms_requests(
    days: int = 30,
    requests_per_day: int = TDMS_REQUESTS_PER_DAY,
    seed: int = DEFAULT_SEED,
) -> pd.DataFrame:

    rng = random.Random(seed + 100)

    start_date = date.today()

    records: list[dict] = []

    sequence = 1

    for day_offset in range(days):

        request_date = start_date + timedelta(
            days=day_offset
        )

        for _ in range(requests_per_day):

            section, km, location_scenario = choose_location(
                rng
            )

            defect_type = choose_defect(rng)

            priority = weighted_priority(rng)

            scenario = choose_scenario(
                priority,
                rng,
            )

            if location_scenario == "cross_department_cluster":
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

            severity_score = {
                "Critical": rng.randint(85, 100),
                "High": rng.randint(65, 84),
                "Medium": rng.randint(40, 64),
                "Low": rng.randint(15, 39),
            }[priority]

            request_id = (
                f"OHE-26027-{sequence:05d}"
            )

            records.append(
                {
                    "request_id": request_id,
                    "request_date": request_date.isoformat(),
                    "department": "TDMS",
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


def save_tdms_requests(
    dataframe: pd.DataFrame,
) -> Path:

    output_directory = (
        MAINTENANCE_DATA_DIR / "TDMS"
    )

    output_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        output_directory
        / "tdms_requests.csv"
    )

    dataframe.to_csv(
        output_path,
        index=False,
    )

    return output_path


if __name__ == "__main__":

    data = generate_tdms_requests()

    path = save_tdms_requests(data)

    print(
        "TDMS dataset generated successfully."
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

    print(
        "\nCross-department cluster records:"
    )

    print(
        (
            data["scenario"]
            == "cross_department_cluster"
        ).sum()
    )