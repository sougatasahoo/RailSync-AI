import pandas as pd


PRIORITY_SCORES = {
    "Critical": 100,
    "High": 80,
    "Medium": 60,
    "Low": 40,
}


DEPARTMENT_NAMES = {
    "TMS": "Track",
    "TDMS": "Traction",
    "SMMS": "Signal & Telecom",
}


REQUIRED_COLUMNS = [
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


def validate_columns(df: pd.DataFrame) -> None:
    """
    Verify that every upstream maintenance feed provides
    the common RailSync maintenance schema.
    """

    missing = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Maintenance dataset is missing required "
            f"columns: {missing}"
        )


def normalize_maintenance(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Convert department-specific maintenance feeds into
    a common RailSync representation.
    """

    validate_columns(df)

    normalized = df.copy()

    normalized["department_name"] = (
        normalized["department"]
        .map(DEPARTMENT_NAMES)
        .fillna("Unknown")
    )

    normalized["priority_score"] = (
        normalized["priority"]
        .map(PRIORITY_SCORES)
        .fillna(40)
        .astype(float)
    )

    normalized["severity_score"] = pd.to_numeric(
        normalized["severity_score"],
        errors="coerce",
    ).fillna(0)

    normalized["duration_minutes"] = pd.to_numeric(
        normalized["duration_minutes"],
        errors="coerce",
    ).fillna(0)

    normalized["km"] = pd.to_numeric(
        normalized["km"],
        errors="coerce",
    ).round(3)

    normalized["request_date"] = pd.to_datetime(
        normalized["request_date"],
        errors="coerce",
    )

    normalized["due_date"] = pd.to_datetime(
        normalized["due_date"],
        errors="coerce",
    )

    normalized["days_to_due"] = (
        normalized["due_date"]
        - normalized["request_date"]
    ).dt.days

    # This is a transparent prototype score.
    # Later, XGBoost will produce the ML-based priority score.
    normalized["maintenance_score"] = (
        normalized["priority_score"] * 0.60
        + normalized["severity_score"] * 0.40
    ).round(2)

    normalized["is_cluster_candidate"] = (
        normalized["scenario"]
        == "cross_department_cluster"
    )

    return normalized


def map_to_sections(
    maintenance_df: pd.DataFrame,
    sections_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Map each maintenance request to the railway section
    containing its kilometer location.
    """

    required_section_columns = [
        "section_code",
        "section_name",
        "start_km",
        "end_km",
    ]

    missing = [
        column
        for column in required_section_columns
        if column not in sections_df.columns
    ]

    if missing:
        raise ValueError(
            f"Section master is missing columns: {missing}"
        )

    sections = sections_df[
        required_section_columns
    ].copy()

    mapped = maintenance_df.copy()

    def find_section(km):
        if pd.isna(km):
            return None

        matches = sections[
            (sections["start_km"] <= km)
            & (sections["end_km"] >= km)
        ]

        if matches.empty:
            return None

        return matches.iloc[0]

    mapped_section_codes = []
    mapped_section_names = []

    for km in mapped["km"]:
        match = find_section(km)

        if match is None:
            mapped_section_codes.append("UNMAPPED")
            mapped_section_names.append("Unmapped")
        else:
            mapped_section_codes.append(
                match["section_code"]
            )
            mapped_section_names.append(
                match["section_name"]
            )

    mapped["mapped_section_code"] = mapped_section_codes
    mapped["mapped_section_name"] = mapped_section_names

    return mapped