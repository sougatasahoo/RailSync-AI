from pathlib import Path
import csv


PROJECT_ROOT = Path(__file__).resolve().parents[2]

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "operational_data"
)


STATIONS = [
    {
        "station_code": "HWH",
        "station_name": "Howrah",
        "km": 0.0,
        "station_type": "Terminal",
        "division": "Kharagpur Division",
    },
    {
        "station_code": "SER",
        "station_name": "Santragachi",
        "km": 8.0,
        "station_type": "Junction",
        "division": "Kharagpur Division",
    },
    {
        "station_code": "SRC",
        "station_name": "Santragachi",
        "km": 12.0,
        "station_type": "Major",
        "division": "Kharagpur Division",
    },
    {
        "station_code": "PKU",
        "station_name": "Panskura",
        "km": 115.0,
        "station_type": "Junction",
        "division": "Kharagpur Division",
    },
    {
        "station_code": "MCA",
        "station_name": "Mecheda",
        "km": 118.0,
        "station_type": "Major",
        "division": "Kharagpur Division",
    },
    {
        "station_code": "KGP",
        "station_name": "Kharagpur",
        "km": 170.0,
        "station_type": "Junction",
        "division": "Kharagpur Division",
    },
    {
        "station_code": "TATA",
        "station_name": "Tatanagar",
        "km": 185.0,
        "station_type": "Major",
        "division": "Kharagpur Division",
    },
    {
        "station_code": "GID",
        "station_name": "Gidni",
        "km": 215.0,
        "station_type": "Major",
        "division": "Kharagpur Division",
    },
]


SECTIONS = [
    {
        "section_code": "HWH-SRC",
        "section_name": "Howrah–Santragachi",
        "start_station": "HWH",
        "end_station": "SRC",
        "start_km": 0.0,
        "end_km": 12.0,
        "length_km": 12.0,
        "tracks": 4,
        "electrified": "Yes",
    },
    {
        "section_code": "SRC-PKU",
        "section_name": "Santragachi–Panskura",
        "start_station": "SRC",
        "end_station": "PKU",
        "start_km": 12.0,
        "end_km": 115.0,
        "length_km": 103.0,
        "tracks": 4,
        "electrified": "Yes",
    },
    {
        "section_code": "MCA-PKU",
        "section_name": "Mecheda–Panskura",
        "start_station": "MCA",
        "end_station": "PKU",
        "start_km": 115.0,
        "end_km": 125.0,
        "length_km": 10.0,
        "tracks": 4,
        "electrified": "Yes",
    },
    {
        "section_code": "PKU-KGP",
        "section_name": "Panskura–Kharagpur",
        "start_station": "PKU",
        "end_station": "KGP",
        "start_km": 125.0,
        "end_km": 170.0,
        "length_km": 45.0,
        "tracks": 4,
        "electrified": "Yes",
    },
    {
        "section_code": "KGP-GID",
        "section_name": "Kharagpur–Gidni",
        "start_station": "KGP",
        "end_station": "GID",
        "start_km": 170.0,
        "end_km": 215.0,
        "length_km": 45.0,
        "tracks": 2,
        "electrified": "Yes",
    },
]


CORRIDORS = [
    {
        "corridor_id": "COR-001",
        "corridor_name": "Howrah–Kharagpur Main Corridor",
        "start_station": "HWH",
        "end_station": "KGP",
        "start_km": 0.0,
        "end_km": 170.0,
        "length_km": 170.0,
        "operational_priority": "Very High",
    },
    {
        "corridor_id": "COR-002",
        "corridor_name": "Kharagpur–Gidni Corridor",
        "start_station": "KGP",
        "end_station": "GID",
        "start_km": 170.0,
        "end_km": 215.0,
        "length_km": 45.0,
        "operational_priority": "High",
    },
    {
        "corridor_id": "COR-003",
        "corridor_name": "Mecheda–Panskura Operational Segment",
        "start_station": "MCA",
        "end_station": "PKU",
        "start_km": 115.0,
        "end_km": 125.0,
        "length_km": 10.0,
        "operational_priority": "High",
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
        "stations.csv",
        STATIONS,
        [
            "station_code",
            "station_name",
            "km",
            "station_type",
            "division",
        ],
    )

    write_csv(
        "sections.csv",
        SECTIONS,
        [
            "section_code",
            "section_name",
            "start_station",
            "end_station",
            "start_km",
            "end_km",
            "length_km",
            "tracks",
            "electrified",
        ],
    )

    write_csv(
        "corridors.csv",
        CORRIDORS,
        [
            "corridor_id",
            "corridor_name",
            "start_station",
            "end_station",
            "start_km",
            "end_km",
            "length_km",
            "operational_priority",
        ],
    )

    print("Infrastructure datasets generated successfully.")


if __name__ == "__main__":
    main()