from pathlib import Path
from itertools import combinations

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

PRIORITIZED_DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "prioritized_data"
    / "prioritized_maintenance.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "opportunities"
)

OUTPUT_PATH = (
    OUTPUT_DIR
    / "joint_opportunities.csv"
)


# Prototype compatibility thresholds.
#
# These are deliberately explicit so that the logic
# can later be replaced or calibrated using operational
# railway data.
SPATIAL_DISTANCE_KM = 1.0

TEMPORAL_DUE_DATE_DAYS = 3

MIN_OPPORTUNITY_SCORE = 60


DEPARTMENT_PAIRS = {
    frozenset(["TMS", "TDMS"]),
    frozenset(["TMS", "SMMS"]),
    frozenset(["TDMS", "SMMS"]),
}


def load_prioritized_data():
    if not PRIORITIZED_DATA_PATH.exists():
        raise FileNotFoundError(
            "Prioritized maintenance dataset not found: "
            f"{PRIORITIZED_DATA_PATH}"
        )

    return pd.read_csv(
        PRIORITIZED_DATA_PATH
    )


def prepare_data(df):
    data = df.copy()

    data["km"] = pd.to_numeric(
        data["km"],
        errors="coerce",
    )

    data["duration_minutes"] = pd.to_numeric(
        data["duration_minutes"],
        errors="coerce",
    ).fillna(0)

    data["days_to_due"] = pd.to_numeric(
        data["days_to_due"],
        errors="coerce",
    ).fillna(0)

    data["ml_priority_score"] = pd.to_numeric(
        data["ml_priority_score"],
        errors="coerce",
    ).fillna(0)

    data["priority_score"] = pd.to_numeric(
        data["priority_score"],
        errors="coerce",
    ).fillna(0)

    data["severity_score"] = pd.to_numeric(
        data["severity_score"],
        errors="coerce",
    ).fillna(0)

    return data


def check_spatial_compatibility(job_a, job_b):
    """
    Determine whether two jobs are geographically close
    enough to be considered for a joint block.
    """

    if pd.isna(job_a["km"]) or pd.isna(job_b["km"]):
        return False, None

    distance = abs(
        job_a["km"] - job_b["km"]
    )

    return (
        distance <= SPATIAL_DISTANCE_KM,
        round(distance, 3),
    )


def check_temporal_compatibility(job_a, job_b):
    """
    Determine whether the maintenance jobs have sufficiently
    compatible due-date requirements.

    The detector does not schedule them yet.
    CP-SAT will perform the actual time feasibility check.
    """

    due_a = job_a["days_to_due"]
    due_b = job_b["days_to_due"]

    difference = abs(
        due_a - due_b
    )

    return difference <= TEMPORAL_DUE_DATE_DAYS


def check_resource_compatibility(job_a, job_b):
    """
    Determine whether the two jobs use different resource
    categories, allowing them to potentially be executed
    concurrently within one coordinated block.

    If both jobs require exactly the same resource type,
    the candidate is rejected at this stage.
    """

    resource_a = str(
        job_a["required_resource"]
    ).strip()

    resource_b = str(
        job_b["required_resource"]
    ).strip()

    if not resource_a or not resource_b:
        return False

    return resource_a != resource_b


def check_department_compatibility(
    job_a,
    job_b,
):
    departments = frozenset(
        [
            job_a["department"],
            job_b["department"],
        ]
    )

    return departments in DEPARTMENT_PAIRS


def calculate_opportunity_score(
    job_a,
    job_b,
    spatial_distance,
):
    """
    Calculate an interpretable candidate score.

    The score combines:
    - spatial closeness
    - temporal compatibility
    - ML maintenance priority
    """

    spatial_score = max(
        0,
        100
        * (
            1
            - spatial_distance
            / SPATIAL_DISTANCE_KM
        ),
    )

    temporal_difference = abs(
        job_a["days_to_due"]
        - job_b["days_to_due"]
    )

    temporal_score = max(
        0,
        100
        * (
            1
            - temporal_difference
            / TEMPORAL_DUE_DATE_DAYS
        ),
    )

    priority_score = (
        job_a["ml_priority_score"]
        + job_b["ml_priority_score"]
    ) / 2

    score = (
        spatial_score * 0.40
        + temporal_score * 0.25
        + priority_score * 0.35
    )

    return round(
        min(score, 100),
        2,
    )


def generate_opportunities(df):
    """
    Generate candidate joint-maintenance opportunities.

    We intentionally process only high-value candidates
    instead of comparing all 5,850 records against each
    other.
    """

    candidates = df[
        (
            df["is_cluster_candidate"]
            == True
        )
        | (
            df["ml_priority_score"]
            >= 75
        )
    ].copy()

    candidates = candidates[
        candidates["km"].notna()
    ]

    # Group by mapped railway section first.
    # This dramatically reduces unnecessary pair comparisons.
    groups = candidates.groupby(
        "mapped_section_code"
    )

    opportunities = []

    opportunity_number = 1

    for section_code, group in groups:

        records = (
            group
            .reset_index(drop=True)
            .to_dict("records")
        )

        for job_a, job_b in combinations(
            records,
            2,
        ):

            if job_a["department"] == job_b["department"]:
                continue

            if not check_department_compatibility(
                job_a,
                job_b,
            ):
                continue

            spatial_ok, distance = (
                check_spatial_compatibility(
                    job_a,
                    job_b,
                )
            )

            if not spatial_ok:
                continue

            temporal_ok = (
                check_temporal_compatibility(
                    job_a,
                    job_b,
                )
            )

            if not temporal_ok:
                continue

            resource_ok = (
                check_resource_compatibility(
                    job_a,
                    job_b,
                )
            )

            if not resource_ok:
                continue

            score = calculate_opportunity_score(
                job_a,
                job_b,
                distance,
            )

            if score < MIN_OPPORTUNITY_SCORE:
                continue

            opportunity_id = (
                f"JO-26027-{opportunity_number:04d}"
            )

            opportunities.append(
                {
                    "opportunity_id": opportunity_id,
                    "section_code": section_code,
                    "section_name": job_a[
                        "mapped_section_name"
                    ],
                    "job_1_request_id": job_a[
                        "request_id"
                    ],
                    "job_1_department": job_a[
                        "department"
                    ],
                    "job_1_defect_type": job_a[
                        "defect_type"
                    ],
                    "job_1_km": job_a["km"],
                    "job_1_resource": job_a[
                        "required_resource"
                    ],
                    "job_1_priority_score": job_a[
                        "ml_priority_score"
                    ],
                    "job_2_request_id": job_b[
                        "request_id"
                    ],
                    "job_2_department": job_b[
                        "department"
                    ],
                    "job_2_defect_type": job_b[
                        "defect_type"
                    ],
                    "job_2_km": job_b["km"],
                    "job_2_resource": job_b[
                        "required_resource"
                    ],
                    "job_2_priority_score": job_b[
                        "ml_priority_score"
                    ],
                    "spatial_distance_km": distance,
                    "temporal_compatible": temporal_ok,
                    "resource_compatible": resource_ok,
                    "opportunity_score": score,
                    "status": "Candidate",
                }
            )

            opportunity_number += 1

    return pd.DataFrame(
        opportunities
    )


def run_detection():
    print("==============================================")
    print("RAILSYNC AI — JOINT OPPORTUNITY DETECTOR")
    print("==============================================")

    print()
    print("1. Loading prioritized maintenance data...")

    df = load_prioritized_data()

    print(
        f"   Loaded records: {len(df)}"
    )

    print()
    print("2. Preparing compatibility features...")

    df = prepare_data(df)

    print(
        f"   Candidate source records: "
        f"{len(df)}"
    )

    print()
    print("3. Detecting compatible maintenance pairs...")

    opportunities = generate_opportunities(
        df
    )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    opportunities.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print()
    print(
        f"Joint opportunities found: "
        f"{len(opportunities)}"
    )

    if not opportunities.empty:
        print()
        print("Top 10 candidate opportunities:")

        print(
            opportunities[
                [
                    "opportunity_id",
                    "section_code",
                    "job_1_request_id",
                    "job_2_request_id",
                    "spatial_distance_km",
                    "opportunity_score",
                    "status",
                ]
            ]
            .head(10)
            .to_string(index=False)
        )

    print()
    print(
        f"Output: {OUTPUT_PATH}"
    )

    print()
    print(
        "Joint opportunity detection completed successfully."
    )

    return opportunities


if __name__ == "__main__":
    run_detection()