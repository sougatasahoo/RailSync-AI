from pathlib import Path

import pandas as pd


# ============================================================
# RailSync AI - Data Fusion Service
# ============================================================
# This service connects the validated railway datasets into
# a unified planning-oriented data structure.
#
# It does NOT perform:
# - ML prioritization
# - optimization
# - final scheduling
#
# Its job is to:
# 1. Load all railway source datasets.
# 2. Combine TMS, SMMS and TDMS maintenance requests.
# 3. Connect maintenance requests with:
#       - COA operational windows
#       - HRMS manpower
#       - TMMMS machines
#       - Stores materials
# 4. Normalize missing values for safe downstream use.
# 5. Produce a unified set of planning records.
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


def _read_csv(dataset_name: str) -> pd.DataFrame:
    """Read one configured CSV dataset."""

    path = DATASETS[dataset_name]

    if not path.exists():
        raise FileNotFoundError(
            f"{dataset_name} dataset not found: {path}"
        )

    return pd.read_csv(path)


def load_operational_data() -> pd.DataFrame:
    """Load and normalize COA operational windows."""

    dataframe = _read_csv("operational")

    dataframe["date"] = pd.to_datetime(
        dataframe["date"],
        errors="coerce",
    ).dt.date

    dataframe["start_time"] = (
        dataframe["start_time"]
        .fillna("")
        .astype(str)
    )

    dataframe["end_time"] = (
        dataframe["end_time"]
        .fillna("")
        .astype(str)
    )

    dataframe["available_hours"] = pd.to_numeric(
        dataframe["available_hours"],
        errors="coerce",
    )

    dataframe["passenger_train_count"] = pd.to_numeric(
        dataframe["passenger_train_count"],
        errors="coerce",
    )

    dataframe["goods_train_count"] = pd.to_numeric(
        dataframe["goods_train_count"],
        errors="coerce",
    )

    dataframe["block_allowed"] = (
        dataframe["block_allowed"]
        .astype(str)
        .str.lower()
        .map(
            {
                "true": True,
                "false": False,
            }
        )
        .fillna(False)
    )

    dataframe["section"] = (
        dataframe["section"]
        .fillna("")
        .astype(str)
    )

    dataframe["location"] = (
        dataframe["location"]
        .fillna("")
        .astype(str)
    )

    dataframe["window_type"] = (
        dataframe["window_type"]
        .fillna("")
        .astype(str)
    )

    dataframe["traffic_level"] = (
        dataframe["traffic_level"]
        .fillna("")
        .astype(str)
    )

    dataframe["notes"] = (
        dataframe["notes"]
        .fillna("")
        .astype(str)
    )

    return dataframe


def load_maintenance_data() -> pd.DataFrame:
    """
    Combine TMS, SMMS and TDMS into one common maintenance
    dataset.

    Missing optional values are normalized so downstream
    services and FastAPI JSON responses never receive
    pandas NaN values.
    """

    datasets = []

    for department in ("tms", "smms", "tdms"):
        dataframe = _read_csv(department).copy()

        dataframe["source_system"] = department.upper()

        datasets.append(dataframe)

    maintenance = pd.concat(
        datasets,
        ignore_index=True,
    )

    maintenance["reported_date"] = pd.to_datetime(
        maintenance["reported_date"],
        errors="coerce",
    ).dt.date

    maintenance["due_date"] = pd.to_datetime(
        maintenance["due_date"],
        errors="coerce",
    ).dt.date

    maintenance["estimated_duration_hours"] = pd.to_numeric(
        maintenance["estimated_duration_hours"],
        errors="coerce",
    )

    maintenance["required_manpower"] = pd.to_numeric(
        maintenance["required_manpower"],
        errors="coerce",
    )

    maintenance["block_required"] = (
        maintenance["block_required"]
        .astype(str)
        .str.lower()
        .map(
            {
                "true": True,
                "false": False,
            }
        )
        .fillna(False)
    )

    # --------------------------------------------------------
    # Normalize optional text fields.
    #
    # Pandas represents empty CSV cells as NaN. NaN is not
    # valid JSON, so convert optional fields to safe strings.
    # --------------------------------------------------------

    text_columns = [
        "required_machine",
        "required_materials",
        "operational_impact",
        "activity",
        "asset_type",
        "asset_id",
        "location",
        "section",
        "priority",
        "status",
    ]

    for column in text_columns:
        if column in maintenance.columns:
            maintenance[column] = (
                maintenance[column]
                .fillna("")
                .astype(str)
            )

    # Keep required numeric fields safe as well.
    maintenance["estimated_duration_hours"] = (
        maintenance["estimated_duration_hours"]
        .fillna(0.0)
    )

    maintenance["required_manpower"] = (
        maintenance["required_manpower"]
        .fillna(0)
    )

    return maintenance


def load_manpower_data() -> pd.DataFrame:
    """Load HRMS manpower availability."""

    dataframe = _read_csv("hrms")

    dataframe["availability_date"] = pd.to_datetime(
        dataframe["availability_date"],
        errors="coerce",
    ).dt.date

    dataframe["assigned_hours"] = pd.to_numeric(
        dataframe["assigned_hours"],
        errors="coerce",
    ).fillna(0)

    dataframe["max_daily_hours"] = pd.to_numeric(
        dataframe["max_daily_hours"],
        errors="coerce",
    ).fillna(0)

    dataframe["remaining_hours"] = (
        dataframe["max_daily_hours"]
        - dataframe["assigned_hours"]
    )

    return dataframe


def load_machine_data() -> pd.DataFrame:
    """Load TMMMS machine availability."""

    dataframe = _read_csv("tmmms")

    dataframe["availability_date"] = pd.to_datetime(
        dataframe["availability_date"],
        errors="coerce",
    ).dt.date

    dataframe["maintenance_due_date"] = pd.to_datetime(
        dataframe["maintenance_due_date"],
        errors="coerce",
    ).dt.date

    dataframe["assigned_hours"] = pd.to_numeric(
        dataframe["assigned_hours"],
        errors="coerce",
    ).fillna(0)

    dataframe["max_daily_hours"] = pd.to_numeric(
        dataframe["max_daily_hours"],
        errors="coerce",
    ).fillna(0)

    dataframe["remaining_hours"] = (
        dataframe["max_daily_hours"]
        - dataframe["assigned_hours"]
    )

    return dataframe


def load_material_data() -> pd.DataFrame:
    """Load Stores material availability."""

    dataframe = _read_csv("stores")

    dataframe["available_quantity"] = pd.to_numeric(
        dataframe["available_quantity"],
        errors="coerce",
    ).fillna(0)

    dataframe["reserved_quantity"] = pd.to_numeric(
        dataframe["reserved_quantity"],
        errors="coerce",
    ).fillna(0)

    dataframe["reorder_level"] = pd.to_numeric(
        dataframe["reorder_level"],
        errors="coerce",
    ).fillna(0)

    dataframe["usable_quantity"] = (
        dataframe["available_quantity"]
        - dataframe["reserved_quantity"]
    )

    dataframe["last_updated"] = pd.to_datetime(
        dataframe["last_updated"],
        errors="coerce",
    ).dt.date

    return dataframe


def find_matching_operational_windows(
    maintenance_request: pd.Series,
    operational_data: pd.DataFrame,
) -> pd.DataFrame:
    """
    Find COA windows that match the maintenance request's
    section and due-date period.

    This is a candidate-matching step, not optimization.
    """

    section = maintenance_request["section"]
    due_date = maintenance_request["due_date"]

    matches = operational_data[
        (operational_data["section"] == section)
        & (
            operational_data["date"]
            <= due_date
        )
    ].copy()

    return matches


def find_matching_machines(
    maintenance_request: pd.Series,
    machine_data: pd.DataFrame,
) -> pd.DataFrame:
    """Find machines matching the required machine type."""

    required_machine = maintenance_request[
        "required_machine"
    ]

    if (
        pd.isna(required_machine)
        or str(required_machine).strip() == ""
    ):
        return machine_data.iloc[0:0].copy()

    matches = machine_data[
        machine_data["machine_type"]
        == str(required_machine).strip()
    ].copy()

    return matches


def find_matching_manpower(
    maintenance_request: pd.Series,
    manpower_data: pd.DataFrame,
) -> pd.DataFrame:
    """
    Find manpower from the same department with a compatible
    section and available status.
    """

    department = maintenance_request["source_system"]

    if department == "TMS":
        department_code = "TMS"
    elif department == "SMMS":
        department_code = "SMMS"
    else:
        department_code = "TDMS"

    matches = manpower_data[
        (
            manpower_data["department"]
            == department_code
        )
        & (
            manpower_data["availability_status"]
            != "Unavailable"
        )
    ].copy()

    return matches


def find_matching_materials(
    maintenance_request: pd.Series,
    material_data: pd.DataFrame,
) -> pd.DataFrame:
    """
    Find Stores records for every material required by
    the maintenance request.
    """

    required_materials = maintenance_request[
        "required_materials"
    ]

    if (
        pd.isna(required_materials)
        or str(required_materials).strip() == ""
    ):
        return material_data.iloc[0:0].copy()

    required_names = {
        material.strip()
        for material in str(required_materials).split(";")
        if material.strip()
    }

    matches = material_data[
        material_data["material_name"].isin(required_names)
    ].copy()

    return matches


def build_fused_request(
    maintenance_request: pd.Series,
    operational_data: pd.DataFrame,
    manpower_data: pd.DataFrame,
    machine_data: pd.DataFrame,
    material_data: pd.DataFrame,
) -> dict:
    """
    Build one unified planning record around one maintenance
    request.
    """

    operational_matches = find_matching_operational_windows(
        maintenance_request,
        operational_data,
    )

    machine_matches = find_matching_machines(
        maintenance_request,
        machine_data,
    )

    manpower_matches = find_matching_manpower(
        maintenance_request,
        manpower_data,
    )

    material_matches = find_matching_materials(
        maintenance_request,
        material_data,
    )

    required_duration = float(
        maintenance_request[
            "estimated_duration_hours"
        ]
    )

    feasible_windows = operational_matches[
        (
            operational_matches["block_allowed"]
            == True
        )
        & (
            operational_matches["available_hours"]
            >= required_duration
        )
    ]

    available_machines = machine_matches[
        (
            machine_matches["availability_status"]
            != "Unavailable"
        )
        & (
            machine_matches["remaining_hours"]
            >= required_duration
        )
    ]

    available_manpower = manpower_matches[
        (
            manpower_matches["remaining_hours"]
            > 0
        )
    ]

    material_warnings = []

    for _, material in material_matches.iterrows():
        if (
            material["availability_status"]
            != "Available"
        ):
            material_warnings.append(
                material["material_name"]
            )

        if material["usable_quantity"] <= 0:
            material_warnings.append(
                material["material_name"]
            )

    required_machine = maintenance_request[
        "required_machine"
    ]

    required_materials = maintenance_request[
        "required_materials"
    ]

    return {
        "request_id": str(
            maintenance_request["request_id"]
        ),
        "source_system": str(
            maintenance_request["source_system"]
        ),
        "activity": str(
            maintenance_request["activity"]
        ),
        "section": str(
            maintenance_request["section"]
        ),
        "location": str(
            maintenance_request["location"]
        ),
        "priority": str(
            maintenance_request["priority"]
        ),
        "status": str(
            maintenance_request["status"]
        ),
        "due_date": str(
            maintenance_request["due_date"]
        ),
        "estimated_duration_hours": required_duration,
        "block_required": bool(
            maintenance_request["block_required"]
        ),
        "required_manpower": int(
            maintenance_request["required_manpower"]
        ),
        "required_machine": str(
            required_machine
            if not pd.isna(required_machine)
            else ""
        ),
        "required_materials": str(
            required_materials
            if not pd.isna(required_materials)
            else ""
        ),
        "candidate_operational_windows": (
            operational_matches[
                "window_id"
            ].astype(str).tolist()
        ),
        "feasible_operational_windows": (
            feasible_windows[
                "window_id"
            ].astype(str).tolist()
        ),
        "matching_machines": (
            machine_matches[
                "machine_id"
            ].astype(str).tolist()
        ),
        "available_machines": (
            available_machines[
                "machine_id"
            ].astype(str).tolist()
        ),
        "available_manpower_count": int(
            len(available_manpower)
        ),
        "matching_materials": (
            material_matches[
                "material_name"
            ].astype(str).tolist()
        ),
        "material_warnings": sorted(
            set(
                str(item)
                for item in material_warnings
            )
        ),
    }


def build_fused_dataset() -> list[dict]:
    """
    Build the complete unified planning dataset.

    Each record represents one maintenance request and
    contains its connected operational and resource context.
    """

    operational_data = load_operational_data()
    maintenance_data = load_maintenance_data()
    manpower_data = load_manpower_data()
    machine_data = load_machine_data()
    material_data = load_material_data()

    fused_records = []

    for _, request in maintenance_data.iterrows():
        fused_records.append(
            build_fused_request(
                maintenance_request=request,
                operational_data=operational_data,
                manpower_data=manpower_data,
                machine_data=machine_data,
                material_data=material_data,
            )
        )

    return fused_records


def get_fusion_summary() -> dict:
    """Return a compact summary of the fused dataset."""

    records = build_fused_dataset()

    total_requests = len(records)

    requests_with_windows = sum(
        1
        for record in records
        if record["candidate_operational_windows"]
    )

    requests_with_feasible_windows = sum(
        1
        for record in records
        if record["feasible_operational_windows"]
    )

    requests_with_machine = sum(
        1
        for record in records
        if record["available_machines"]
    )

    requests_with_material_warnings = sum(
        1
        for record in records
        if record["material_warnings"]
    )

    return {
        "total_maintenance_requests": total_requests,
        "requests_with_operational_windows": (
            requests_with_windows
        ),
        "requests_with_feasible_windows": (
            requests_with_feasible_windows
        ),
        "requests_with_available_machine": (
            requests_with_machine
        ),
        "requests_with_material_warnings": (
            requests_with_material_warnings
        ),
    }