from pathlib import Path


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = PROJECT_ROOT / "data"

MAINTENANCE_DATA_DIR = DATA_DIR / "maintenance_data"
OPERATIONAL_DATA_DIR = DATA_DIR / "operational_data"
RESOURCE_DATA_DIR = DATA_DIR / "resource_data"


# ============================================================
# SYNTHETIC DATASET SETTINGS
# ============================================================

DEFAULT_SEED = 26027

DEFAULT_DAYS = 30

TMS_REQUESTS_PER_DAY = 65
TDMS_REQUESTS_PER_DAY = 65
SMMS_REQUESTS_PER_DAY = 65


# ============================================================
# SIMULATION CONTEXT
# ============================================================

DIVISION = "Kharagpur Division"

CORRIDOR_NAME = "Howrah–Kharagpur Operational Simulation"

ZONE = "South Eastern Railway"


# ============================================================
# MAINTENANCE DEPARTMENTS
# ============================================================

DEPARTMENTS = [
    "TMS",
    "TDMS",
    "SMMS",
]


# ============================================================
# MAINTENANCE PRIORITY LEVELS
# ============================================================

PRIORITY_LEVELS = [
    "Critical",
    "High",
    "Medium",
    "Low",
]


# ============================================================
# MAINTENANCE DEFECT TYPES
# ============================================================

TMS_DEFECT_TYPES = [
    "Track geometry defect",
    "Rail defect",
    "Sleeper defect",
    "Ballast issue",
    "Track wear",
    "USFD-related inspection",
    "Preventive track maintenance",
]


TDMS_DEFECT_TYPES = [
    "OHE defect",
    "Contact wire inspection",
    "Insulator replacement",
    "Pantograph interaction issue",
    "Sectioning equipment inspection",
    "Traction substation inspection",
    "Preventive OHE maintenance",
]


SMMS_DEFECT_TYPES = [
    "Signal failure",
    "Point machine inspection",
    "Axle counter issue",
    "Track circuit testing",
    "Interlocking inspection",
    "Signal equipment defect",
    "Preventive S&T maintenance",
]


# ============================================================
# RESOURCE TYPES
# ============================================================

TMS_RESOURCES = [
    "Track Machine",
    "Track Gang",
    "Rail Welding Team",
    "Track Inspection Team",
]


TDMS_RESOURCES = [
    "OHE Crew",
    "OHE Tower Wagon",
    "Traction Maintenance Team",
    "Electrical Inspection Team",
]


SMMS_RESOURCES = [
    "S&T Crew",
    "Signal Testing Team",
    "Point Machine Team",
    "Telecom Maintenance Team",
]


# ============================================================
# OPERATIONAL SCENARIOS
# ============================================================

SCENARIOS = [
    "normal",
    "high_defect_load",
    "heavy_train_traffic",
    "resource_shortage",
    "cross_department_cluster",
    "critical_defect",
    "high_conflict",
    "mixed_realistic",
]


# ============================================================
# STATION / SECTION CONTEXT
# ============================================================

STATION_CODES = [
    "HWH",
    "SER",
    "BLY",
    "SRC",
    "TATA",
    "PKU",
    "MCA",
    "KGP",
]


# ============================================================
# DEFAULT PLANNING WINDOW
# ============================================================

PLANNING_START_HOUR = 8

PLANNING_END_HOUR = 18


# ============================================================
# SYNTHETIC DATA GENERATION NOTES
# ============================================================

DATASET_NOTES = {
    "source_type": "Synthetic / Representative",
    "seed": DEFAULT_SEED,
    "days": DEFAULT_DAYS,
    "purpose": "Railway block planning prototype",
    "live_railway_data": False,
}