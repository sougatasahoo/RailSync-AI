from pathlib import Path

import pandas as pd


# ============================================================
# RailSync AI - Data Validation Service
# ============================================================
# Reads the synthetic railway datasets and performs basic
# structural and cross-category validation.
#
# This service does NOT make AI decisions.
# It only checks whether the input data is usable.
# ============================================================


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_ROOT = PROJECT_ROOT / "data"


DATASETS = {
    "operational": (
        DATA_ROOT
        / "operational_data"
        / "coa"
        / "operational_windows.csv"
    ),
    "tms": (
        DATA_ROOT
        / "maintenance_data"
        / "tms"
        / "maintenance_requests.csv"
    ),
    "smms": (
        DATA_ROOT
        / "maintenance_data"
        / "smms"
        / "maintenance_requests.csv"
    ),
    "tdms": (
        DATA_ROOT
        / "maintenance_data"
        / "tdms"
        / "maintenance_requests.csv"
    ),
    "hrms": (
        DATA_ROOT
        / "resource_data"
        / "hrms"
        / "manpower.csv"
    ),
    "tmmms": (
        DATA_ROOT
        / "resource_data"
        / "tmmms"
        / "machines.csv"
    ),
    "stores": (
        DATA_ROOT
        / "material_data"
        / "stores"
        / "materials.csv"
    ),
}


EXPECTED_COLUMNS = {
    "operational": [
        "window_id",
        "date",
        "section",
        "location",
        "start_time",
        "end_time",
        "window_type",
        "available_hours",
        "traffic_level",
        "passenger_train_count",
        "goods_train_count",
        "block_allowed",
        "notes",
    ],
    "tms": [
        "request_id",
        "activity",
        "asset_type",
        "asset_id",
        "location",
        "section",
        "priority",
        "status",
        "reported_date",
        "due_date",
        "estimated_duration_hours",
        "block_required",
        "operational_impact",
        "required_manpower",
        "required_machine",
        "required_materials",
    ],
    "smms": [
        "request_id",
        "activity",
        "asset_type",
        "asset_id",
        "location",
        "section",
        "priority",
        "status",
        "reported_date",
        "due_date",
        "estimated_duration_hours",
        "block_required",
        "operational_impact",
        "required_manpower",
        "required_machine",
        "required_materials",
    ],
    "tdms": [
        "request_id",
        "activity",
        "asset_type",
        "asset_id",
        "location",
        "section",
        "priority",
        "status",
        "reported_date",
        "due_date",
        "estimated_duration_hours",
        "block_required",
        "operational_impact",
        "required_manpower",
        "required_machine",
        "required_materials",
    ],
    "hrms": [
        "employee_id",
        "department",
        "role",
        "skill",
        "base_location",
        "section",
        "availability_date",
        "shift_start",
        "shift_end",
        "availability_status",
        "assigned_hours",
        "max_daily_hours",
    ],
    "tmmms": [
        "machine_id",
        "machine_type",
        "description",
        "base_location",
        "section",
        "availability_date",
        "shift_start",
        "shift_end",
        "availability_status",
        "assigned_hours",
        "max_daily_hours",
        "maintenance_due_date",
    ],
    "stores": [
        "material_id",
        "material_name",
        "category",
        "unit",
        "available_quantity",
        "reserved_quantity",
        "reorder_level",
        "store_location",
        "availability_status",
        "last_updated",
    ],
}


def load_csv(dataset_name: str) -> pd.DataFrame:
    """Load one configured dataset."""

    path = DATASETS[dataset_name]

    if not path.exists():
        raise FileNotFoundError(
            f"{dataset_name} dataset not found: {path}"
        )

    return pd.read_csv(path)


def validate_columns(
    dataset_name: str,
    dataframe: pd.DataFrame,
) -> list[str]:
    """Check whether the expected columns exist."""

    expected = EXPECTED_COLUMNS[dataset_name]

    return [
        column
        for column in expected
        if column not in dataframe.columns
    ]


def validate_duplicates(
    dataset_name: str,
    dataframe: pd.DataFrame,
) -> int:
    """Count duplicate rows."""

    return int(dataframe.duplicated().sum())


def validate_empty_values(
    dataset_name: str,
    dataframe: pd.DataFrame,
) -> int:
    """Count missing values across the dataset."""

    return int(dataframe.isna().sum().sum())


def validate_positive_durations(
    dataframe: pd.DataFrame,
) -> int:
    """Check maintenance requests for invalid durations."""

    if "estimated_duration_hours" not in dataframe.columns:
        return 0

    durations = pd.to_numeric(
        dataframe["estimated_duration_hours"],
        errors="coerce",
    )

    return int((durations <= 0).sum())


def validate_cross_category_links(
    maintenance_data: pd.DataFrame,
    operational_data: pd.DataFrame,
    machine_data: pd.DataFrame,
    manpower_data: pd.DataFrame,
    material_data: pd.DataFrame,
) -> dict:
    """
    Check whether maintenance requests reference sections,
    machines and materials that exist somewhere in the
    corresponding datasets.

    This is intentionally a basic consistency check.
    Detailed feasibility logic will be implemented later.
    """

    maintenance_sections = set(
        maintenance_data["section"].dropna().astype(str)
    )

    operational_sections = set(
        operational_data["section"].dropna().astype(str)
    )

    machine_types = set(
        machine_data["machine_type"].dropna().astype(str)
    )

    skills = set(
        manpower_data["skill"].dropna().astype(str)
    )

    materials = set(
        material_data["material_name"].dropna().astype(str)
    )

    missing_sections = sorted(
        maintenance_sections - operational_sections
    )

    referenced_machines = set(
        maintenance_data["required_machine"]
        .dropna()
        .astype(str)
    )

    missing_machines = sorted(
        referenced_machines - machine_types
    )

    referenced_materials = set()

    for value in (
        maintenance_data["required_materials"]
        .dropna()
        .astype(str)
    ):
        for material in value.split(";"):
            material = material.strip()

            if material:
                referenced_materials.add(material)

    missing_materials = sorted(
        referenced_materials - materials
    )

    return {
        "maintenance_sections_not_in_operational_data":
            missing_sections,
        "required_machines_not_in_tmmms":
            missing_machines,
        "required_materials_not_in_stores":
            missing_materials,
        "available_hrms_skills": sorted(skills),
    }


def validate_all_datasets() -> dict:
    """Run validation across all RailSync AI input datasets."""

    loaded = {}
    dataset_results = {}

    for dataset_name in DATASETS:
        dataframe = load_csv(dataset_name)
        loaded[dataset_name] = dataframe

        missing_columns = validate_columns(
            dataset_name,
            dataframe,
        )

        duplicate_rows = validate_duplicates(
            dataset_name,
            dataframe,
        )

        empty_values = validate_empty_values(
            dataset_name,
            dataframe,
        )

        dataset_result = {
            "status": "valid",
            "row_count": int(len(dataframe)),
            "missing_columns": missing_columns,
            "duplicate_rows": duplicate_rows,
            "empty_values": empty_values,
        }

        if missing_columns:
            dataset_result["status"] = "invalid"

        dataset_results[dataset_name] = dataset_result

    maintenance_frames = [
        loaded["tms"],
        loaded["smms"],
        loaded["tdms"],
    ]

    maintenance_data = pd.concat(
        maintenance_frames,
        ignore_index=True,
    )

    positive_duration_errors = validate_positive_durations(
        maintenance_data
    )

    cross_category = validate_cross_category_links(
        maintenance_data=maintenance_data,
        operational_data=loaded["operational"],
        machine_data=loaded["tmmms"],
        manpower_data=loaded["hrms"],
        material_data=loaded["stores"],
    )

    total_missing_columns = sum(
        len(result["missing_columns"])
        for result in dataset_results.values()
    )

    total_duplicate_rows = sum(
        result["duplicate_rows"]
        for result in dataset_results.values()
    )

    total_empty_values = sum(
        result["empty_values"]
        for result in dataset_results.values()
    )

    overall_status = "valid"

    if (
        total_missing_columns > 0
        or positive_duration_errors > 0
        or cross_category[
            "maintenance_sections_not_in_operational_data"
        ]
        or cross_category[
            "required_machines_not_in_tmmms"
        ]
        or cross_category[
            "required_materials_not_in_stores"
        ]
    ):
        overall_status = "review_required"

    return {
        "status": overall_status,
        "datasets": dataset_results,
        "maintenance_validation": {
            "total_requests": int(len(maintenance_data)),
            "invalid_duration_count": positive_duration_errors,
        },
        "cross_category_validation": cross_category,
        "summary": {
            "dataset_count": len(DATASETS),
            "total_rows": sum(
                result["row_count"]
                for result in dataset_results.values()
            ),
            "missing_columns": total_missing_columns,
            "duplicate_rows": total_duplicate_rows,
            "empty_values": total_empty_values,
        },
    }