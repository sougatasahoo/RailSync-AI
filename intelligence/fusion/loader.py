from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = PROJECT_ROOT / "data"

MAINTENANCE_DIR = DATA_DIR / "maintenance_data"
OPERATIONAL_DIR = DATA_DIR / "operational_data"
RESOURCE_DIR = DATA_DIR / "resource_data"


MAINTENANCE_FILES = {
    "TMS": MAINTENANCE_DIR / "TMS" / "tms_requests.csv",
    "TDMS": MAINTENANCE_DIR / "TDMS" / "tdms_requests.csv",
    "SMMS": MAINTENANCE_DIR / "SMMS" / "smms_requests.csv",
}


def load_maintenance_feeds() -> pd.DataFrame:
    """
    Load TMS, TDMS and SMMS maintenance feeds.

    These files represent the upstream maintenance
    systems in the RailSync prototype.
    """

    frames = []

    for department, path in MAINTENANCE_FILES.items():
        if not path.exists():
            raise FileNotFoundError(
                f"{department} maintenance feed not found: {path}"
            )

        frame = pd.read_csv(path)

        # Trust the source-system feed identity rather than
        # allowing inconsistent department values.
        frame["department"] = department

        frames.append(frame)

    if not frames:
        raise ValueError("No maintenance feeds were loaded.")

    return pd.concat(
        frames,
        ignore_index=True,
    )


def load_sections() -> pd.DataFrame:
    """
    Load the railway section master used for spatial mapping.
    """

    path = OPERATIONAL_DIR / "sections.csv"

    if not path.exists():
        raise FileNotFoundError(
            f"Section master not found: {path}"
        )

    return pd.read_csv(path)


def load_resources() -> dict:
    """
    Load resource feeds.

    Resource data is returned separately because it will be
    consumed by later prioritization, opportunity and
    optimization stages.
    """

    resource_files = {
        "crews": RESOURCE_DIR / "crews.csv",
        "machines": RESOURCE_DIR / "machines.csv",
        "materials": RESOURCE_DIR / "materials.csv",
    }

    resources = {}

    for resource_name, path in resource_files.items():
        if not path.exists():
            raise FileNotFoundError(
                f"{resource_name} resource feed not found: {path}"
            )

        resources[resource_name] = pd.read_csv(path)

    return resources