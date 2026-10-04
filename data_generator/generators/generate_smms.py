from pathlib import Path
from datetime import date, timedelta
import random

from config.railway_config import (
    DEFAULT_SEED,
    DEFAULT_DAYS,
    SMMS_REQUESTS_PER_DAY,
    SMMS_DEFECT_TYPES,
    SMMS_RESOURCES,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "maintenance_data"
    / "SMMS"
    / "smms_requests.csv"
)


SECTIONS = [
    {
        "section": "Howrah–Santragachi",
        "section_code": "HWH-SRC",
        "start_km": 0.0,
        "end_km": 12.0,
    },
    {
        "section": "Santragachi–Panskura",
        "section_code": "SRC-PKU",
        "start_km": 12.0,
        "end_km": 115.0,
    },
    {
        "section": "Mecheda–Panskura",
        "section_code": "MCA-PKU",
        "start_km": 115.0,
        "end_km": 125.0,
    },
    {
        "section": "Panskura–Kharagpur",
        "section_code": "PKU-KGP",
        "start_km": 125.0,
        "end_km": 170.0,
    },
    {
        "section": "Kharagpur–Gidni",
        "section_code": "KGP-GID",
        "start_km": 170.0,
        "end_km": 215.0,
    },
]


PRIORITIES = ["Critical", "High", "Medium", "Low"]

PRIORITY_WEIGHTS = {
    "Critical": 6,
    "High": 22,
    "Medium": 47,
    "Low": 25,
}


CLUSTER_LOCATIONS = [
    118.2,
    142.5,
    158.0,
    164.3,
]


def choose_section(km):
    for section in SECTIONS:
        if section["start_km"] <= km <= section["end_km"]:
            return section

    return SECTIONS[-1]


def generate_request(
    request_number,
    request_date,
    rng,
):
    # Around 16% of records are intentionally placed
    # near locations that can create cross-department
    # maintenance opportunities.
    if rng.random() < 0.16:
        cluster_km = rng.choice(CLUSTER_LOCATIONS)
        km = round(cluster_km + rng.uniform(-0.4, 0.4), 3)
        scenario = "cross_department_cluster"
    else:
        section = rng.choice(SECTIONS)
        km = round(
            rng.uniform(
                section["start_km"],
                section["end_km"],
            ),
            3,
        )
        scenario = rng.choice(
            [
                "normal",
                "high_defect_load",
                "heavy_train_traffic",
                "resource_shortage",
                "critical_defect",
                "high_conflict",
                "mixed_realistic",
            ]
        )

    section = choose_section(km)

    priority = rng.choices(
        PRIORITIES,
        weights=[
            PRIORITY_WEIGHTS["Critical"],
            PRIORITY_WEIGHTS["High"],
            PRIORITY_WEIGHTS["Medium"],
            PRIORITY_WEIGHTS["Low"],
        ],
        k=1,
    )[0]

    defect_type = rng.choice(SMMS_DEFECT_TYPES)

    resource = rng.choice(SMMS_RESOURCES)

    severity_ranges = {
        "Critical": (90, 100),
        "High": (70, 89),
        "Medium": (45, 69),
        "Low": (20, 44),
    }

    severity_min, severity_max = severity_ranges[priority]

    severity_score = rng.randint(
        severity_min,
        severity_max,
    )

    duration_ranges = {
        "Critical": (45, 120),
        "High": (45, 105),
        "Medium": (30, 90),
        "Low": (20, 75),
    }

    duration_min, duration_max = duration_ranges[priority]

    duration_minutes = rng.randrange(
        duration_min,
        duration_max + 1,
        15,
    )

    due_days = {
        "Critical": 1,
        "High": 3,
        "Medium": 7,
        "Low": 14,
    }

    due_date = request_date + timedelta(
        days=due_days[priority]
    )

    status = rng.choices(
        [
            "Open",
            "Under Review",
            "Planned",
        ],
        weights=[65, 20, 15],
        k=1,
    )[0]

    return {
        "request_id": f"SIG-26027-{request_number:04d}",
        "request_date": request_date.isoformat(),
        "department": "SMMS",
        "section": section["section"],
        "section_code": section["section_code"],
        "km": km,
        "defect_type": defect_type,
        "priority": priority,
        "severity_score": severity_score,
        "duration_minutes": duration_minutes,
        "required_resource": resource,
        "due_date": due_date.isoformat(),
        "scenario": scenario,
        "status": status,
    }


def generate_dataset():
    rng = random.Random(DEFAULT_SEED + 200)

    rows = []

    start_date = date.today()

    total_requests = (
        SMMS_REQUESTS_PER_DAY * DEFAULT_DAYS
    )

    request_number = 1

    for day_offset in range(DEFAULT_DAYS):
        request_date = start_date + timedelta(
            days=day_offset
        )

        for _ in range(SMMS_REQUESTS_PER_DAY):
            row = generate_request(
                request_number=request_number,
                request_date=request_date,
                rng=rng,
            )

            rows.append(row)
            request_number += 1

    return rows


def write_csv(rows):
    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    import csv

    fieldnames = [
        "request_id",
        "request_date",
        "department",
        "section",
        "section_code",
        "km",
        "defect_type",
        "priority",
        "severity_score",
        "duration_minutes",
        "required_resource",
        "due_date",
        "scenario",
        "status",
    ]

    with OUTPUT_PATH.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as csv_file:
        writer = csv.DictWriter(
            csv_file,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(rows)


def print_summary(rows):
    from collections import Counter

    priority_counts = Counter(
        row["priority"]
        for row in rows
    )

    department_counts = Counter(
        row["department"]
        for row in rows
    )

    cluster_count = sum(
        row["scenario"] == "cross_department_cluster"
        for row in rows
    )

    print("SMMS dataset generated successfully.")
    print(f"Rows: {len(rows)}")
    print(f"Output: {OUTPUT_PATH}")
    print()

    print("Priority distribution:")
    for priority in PRIORITIES:
        print(
            f"{priority:<10} "
            f"{priority_counts[priority]}"
        )

    print()

    print("Department:")
    for department, count in department_counts.items():
        print(
            f"{department:<10} "
            f"{count}"
        )

    print()

    print("Cross-department cluster records:")
    print(cluster_count)


if __name__ == "__main__":
    rows = generate_dataset()

    write_csv(rows)

    print_summary(rows)