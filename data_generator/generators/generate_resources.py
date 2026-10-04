from pathlib import Path
import csv


PROJECT_ROOT = Path(__file__).resolve().parents[2]

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "resource_data"
)


CREWS = [
    {
        "crew_id": "CR-TMS-001",
        "department": "TMS",
        "crew_name": "Track Gang Alpha",
        "crew_type": "Track Gang",
        "capacity": 8,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
    {
        "crew_id": "CR-TMS-002",
        "department": "TMS",
        "crew_name": "Track Machine Team",
        "crew_type": "Track Machine",
        "capacity": 6,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
    {
        "crew_id": "CR-TMS-003",
        "department": "TMS",
        "crew_name": "Rail Welding Team",
        "crew_type": "Rail Welding Team",
        "capacity": 5,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
    {
        "crew_id": "CR-TMS-004",
        "department": "TMS",
        "crew_name": "Track Inspection Team",
        "crew_type": "Track Inspection Team",
        "capacity": 4,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Limited",
    },
    {
        "crew_id": "CR-TDMS-001",
        "department": "TDMS",
        "crew_name": "OHE Crew Alpha",
        "crew_type": "OHE Crew",
        "capacity": 7,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
    {
        "crew_id": "CR-TDMS-002",
        "department": "TDMS",
        "crew_name": "OHE Tower Wagon Team",
        "crew_type": "OHE Tower Wagon",
        "capacity": 5,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
    {
        "crew_id": "CR-TDMS-003",
        "department": "TDMS",
        "crew_name": "Traction Maintenance Team",
        "crew_type": "Traction Maintenance Team",
        "capacity": 6,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Limited",
    },
    {
        "crew_id": "CR-TDMS-004",
        "department": "TDMS",
        "crew_name": "Electrical Inspection Team",
        "crew_type": "Electrical Inspection Team",
        "capacity": 4,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
    {
        "crew_id": "CR-SMMS-001",
        "department": "SMMS",
        "crew_name": "S&T Crew Alpha",
        "crew_type": "S&T Crew",
        "capacity": 6,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
    {
        "crew_id": "CR-SMMS-002",
        "department": "SMMS",
        "crew_name": "Signal Testing Team",
        "crew_type": "Signal Testing Team",
        "capacity": 4,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
    {
        "crew_id": "CR-SMMS-003",
        "department": "SMMS",
        "crew_name": "Point Machine Team",
        "crew_type": "Point Machine Team",
        "capacity": 4,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Limited",
    },
    {
        "crew_id": "CR-SMMS-004",
        "department": "SMMS",
        "crew_name": "Telecom Maintenance Team",
        "crew_type": "Telecom Maintenance Team",
        "capacity": 5,
        "shift": "Day",
        "available_from": "08:00",
        "available_to": "18:00",
        "status": "Available",
    },
]


MACHINES = [
    {
        "machine_id": "MCH-TMS-001",
        "department": "TMS",
        "machine_name": "Track Geometry Machine",
        "machine_type": "Track Machine",
        "quantity": 1,
        "status": "Available",
        "location_section": "PKU-KGP",
    },
    {
        "machine_id": "MCH-TMS-002",
        "department": "TMS",
        "machine_name": "Tamping Machine",
        "machine_type": "Track Machine",
        "quantity": 1,
        "status": "Available",
        "location_section": "SRC-PKU",
    },
    {
        "machine_id": "MCH-TMS-003",
        "department": "TMS",
        "machine_name": "Rail Welding Unit",
        "machine_type": "Rail Welding Team",
        "quantity": 1,
        "status": "Limited",
        "location_section": "PKU-KGP",
    },
    {
        "machine_id": "MCH-TDMS-001",
        "department": "TDMS",
        "machine_name": "OHE Tower Wagon",
        "machine_type": "OHE Tower Wagon",
        "quantity": 1,
        "status": "Available",
        "location_section": "PKU-KGP",
    },
    {
        "machine_id": "MCH-TDMS-002",
        "department": "TDMS",
        "machine_name": "OHE Inspection Vehicle",
        "machine_type": "Electrical Inspection Team",
        "quantity": 1,
        "status": "Available",
        "location_section": "SRC-PKU",
    },
    {
        "machine_id": "MCH-SMMS-001",
        "department": "SMMS",
        "machine_name": "Signal Testing Equipment",
        "machine_type": "Signal Testing Team",
        "quantity": 2,
        "status": "Available",
        "location_section": "PKU-KGP",
    },
    {
        "machine_id": "MCH-SMMS-002",
        "department": "SMMS",
        "machine_name": "Point Machine Testing Kit",
        "machine_type": "Point Machine Team",
        "quantity": 2,
        "status": "Available",
        "location_section": "SRC-PKU",
    },
]


MATERIALS = [
    {
        "material_id": "MAT-TMS-001",
        "department": "TMS",
        "material_name": "Rail Fastening Set",
        "unit": "Set",
        "available_quantity": 500,
        "minimum_stock": 100,
        "status": "Available",
    },
    {
        "material_id": "MAT-TMS-002",
        "department": "TMS",
        "material_name": "Rail Welding Consumables",
        "unit": "Set",
        "available_quantity": 80,
        "minimum_stock": 20,
        "status": "Available",
    },
    {
        "material_id": "MAT-TMS-003",
        "department": "TMS",
        "material_name": "Sleeper Replacement Unit",
        "unit": "Unit",
        "available_quantity": 300,
        "minimum_stock": 60,
        "status": "Available",
    },
    {
        "material_id": "MAT-TDMS-001",
        "department": "TDMS",
        "material_name": "Contact Wire Component",
        "unit": "Unit",
        "available_quantity": 120,
        "minimum_stock": 30,
        "status": "Available",
    },
    {
        "material_id": "MAT-TDMS-002",
        "department": "TDMS",
        "material_name": "Insulator Assembly",
        "unit": "Unit",
        "available_quantity": 75,
        "minimum_stock": 20,
        "status": "Available",
    },
    {
        "material_id": "MAT-SMMS-001",
        "department": "SMMS",
        "material_name": "Signal Relay",
        "unit": "Unit",
        "available_quantity": 90,
        "minimum_stock": 20,
        "status": "Available",
    },
    {
        "material_id": "MAT-SMMS-002",
        "department": "SMMS",
        "material_name": "Point Machine Component",
        "unit": "Unit",
        "available_quantity": 60,
        "minimum_stock": 15,
        "status": "Available",
    },
    {
        "material_id": "MAT-SMMS-003",
        "department": "SMMS",
        "material_name": "Axle Counter Module",
        "unit": "Unit",
        "available_quantity": 40,
        "minimum_stock": 10,
        "status": "Limited",
    },
]


def write_csv(filename, rows, fieldnames):
    output_path = OUTPUT_DIR / filename

    with output_path.open(
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

    print(f"Generated: {output_path}")
    print(f"Rows: {len(rows)}")
    print()


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    write_csv(
        "crews.csv",
        CREWS,
        [
            "crew_id",
            "department",
            "crew_name",
            "crew_type",
            "capacity",
            "shift",
            "available_from",
            "available_to",
            "status",
        ],
    )

    write_csv(
        "machines.csv",
        MACHINES,
        [
            "machine_id",
            "department",
            "machine_name",
            "machine_type",
            "quantity",
            "status",
            "location_section",
        ],
    )

    write_csv(
        "materials.csv",
        MATERIALS,
        [
            "material_id",
            "department",
            "material_name",
            "unit",
            "available_quantity",
            "minimum_stock",
            "status",
        ],
    )

    print(
        "Resource datasets generated successfully."
    )


if __name__ == "__main__":
    main()