from pathlib import Path
from datetime import date, timedelta, datetime
import csv
import random


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
    },
    {
        "station_code": "SRC",
        "station_name": "Santragachi",
        "km": 12.0,
    },
    {
        "station_code": "MCA",
        "station_name": "Mecheda",
        "km": 118.0,
    },
    {
        "station_code": "PKU",
        "station_name": "Panskura",
        "km": 115.0,
    },
    {
        "station_code": "KGP",
        "station_name": "Kharagpur",
        "km": 170.0,
    },
    {
        "station_code": "GID",
        "station_name": "Gidni",
        "km": 215.0,
    },
]


SECTIONS = [
    {
        "section_code": "HWH-SRC",
        "start_station": "HWH",
        "end_station": "SRC",
        "start_km": 0.0,
        "end_km": 12.0,
    },
    {
        "section_code": "SRC-PKU",
        "start_station": "SRC",
        "end_station": "PKU",
        "start_km": 12.0,
        "end_km": 115.0,
    },
    {
        "section_code": "PKU-KGP",
        "start_station": "PKU",
        "end_station": "KGP",
        "start_km": 125.0,
        "end_km": 170.0,
    },
    {
        "section_code": "KGP-GID",
        "start_station": "KGP",
        "end_station": "GID",
        "start_km": 170.0,
        "end_km": 215.0,
    },
]


TRAINS = [
    {
        "train_id": "TRN-12001",
        "direction": "Down",
        "speed": 75,
        "priority": "High",
        "departure": "06:10",
    },
    {
        "train_id": "TRN-12002",
        "direction": "Up",
        "speed": 75,
        "priority": "High",
        "departure": "17:10",
    },
    {
        "train_id": "TRN-12801",
        "direction": "Up",
        "speed": 85,
        "priority": "Very High",
        "departure": "05:45",
    },
    {
        "train_id": "TRN-12802",
        "direction": "Down",
        "speed": 85,
        "priority": "Very High",
        "departure": "20:15",
    },
    {
        "train_id": "TRN-18001",
        "direction": "Down",
        "speed": 50,
        "priority": "Medium",
        "departure": "08:00",
    },
    {
        "train_id": "TRN-18002",
        "direction": "Up",
        "speed": 50,
        "priority": "Medium",
        "departure": "15:00",
    },
    {
        "train_id": "TRN-22641",
        "direction": "Up",
        "speed": 82,
        "priority": "Very High",
        "departure": "07:20",
    },
    {
        "train_id": "TRN-22642",
        "direction": "Down",
        "speed": 82,
        "priority": "Very High",
        "departure": "18:40",
    },
    {
        "train_id": "TRN-58001",
        "direction": "Down",
        "speed": 45,
        "priority": "Medium",
        "departure": "09:00",
    },
    {
        "train_id": "TRN-58002",
        "direction": "Up",
        "speed": 45,
        "priority": "Medium",
        "departure": "14:30",
    },
    {
        "train_id": "TRN-68001",
        "direction": "Down",
        "speed": 40,
        "priority": "Low",
        "departure": "10:00",
    },
    {
        "train_id": "TRN-68002",
        "direction": "Up",
        "speed": 40,
        "priority": "Low",
        "departure": "16:00",
    },
    {
        "train_id": "TRN-FRT01",
        "direction": "Down",
        "speed": 40,
        "priority": "Low",
        "departure": "11:00",
    },
    {
        "train_id": "TRN-FRT02",
        "direction": "Up",
        "speed": 40,
        "priority": "Low",
        "departure": "12:00",
    },
    {
        "train_id": "TRN-FRT03",
        "direction": "Down",
        "speed": 38,
        "priority": "Low",
        "departure": "13:00",
    },
    {
        "train_id": "TRN-FRT04",
        "direction": "Up",
        "speed": 38,
        "priority": "Low",
        "departure": "14:00",
    },
]


PRIORITY_VALUE = {
    "Very High": 4,
    "High": 3,
    "Medium": 2,
    "Low": 1,
}


def parse_time(value):
    return datetime.strptime(
        value,
        "%H:%M",
    )


def format_time(value):
    return value.strftime("%H:%M")


def section_travel_minutes(section, speed):
    distance = abs(
        section["end_km"] - section["start_km"]
    )

    travel_hours = distance / speed

    minutes = max(
        8,
        int(round(travel_hours * 60)),
    )

    return minutes


def build_route(train):
    if train["direction"] == "Down":
        return [
            section
            for section in SECTIONS
        ]

    return [
        {
            **section,
            "start_station": section["end_station"],
            "end_station": section["start_station"],
            "start_km": section["end_km"],
            "end_km": section["start_km"],
        }
        for section in reversed(SECTIONS)
    ]


def generate_for_day(
    simulation_date,
    rng,
):
    movements = []
    stops = []

    movement_number = 1

    for train in TRAINS:
        current_time = parse_time(
            train["departure"]
        )

        route = build_route(train)

        for section in route:
            travel_minutes = section_travel_minutes(
                section,
                train["speed"],
            )

            entry_time = current_time
            exit_time = (
                current_time
                + timedelta(minutes=travel_minutes)
            )

            movement_id = (
                f"MOV-{simulation_date.strftime('%Y%m%d')}"
                f"-{movement_number:04d}"
            )

            movement = {
                "movement_id": movement_id,
                "movement_date": simulation_date.isoformat(),
                "train_id": train["train_id"],
                "section_code": section["section_code"],
                "direction": train["direction"],
                "entry_time": format_time(entry_time),
                "exit_time": format_time(exit_time),
                "entry_km": section["start_km"],
                "exit_km": section["end_km"],
                "train_priority": train["priority"],
            }

            movements.append(movement)

            stops.append(
                {
                    "stop_id": (
                        f"STOP-{simulation_date.strftime('%Y%m%d')}"
                        f"-{movement_number:04d}"
                    ),
                    "movement_id": movement_id,
                    "train_id": train["train_id"],
                    "station_code": section["start_station"],
                    "arrival_time": format_time(
                        entry_time
                    ),
                    "departure_time": format_time(
                        entry_time
                    ),
                    "stop_duration_minutes": 0,
                }
            )

            movement_number += 1

            current_time = exit_time + timedelta(
                minutes=rng.randint(2, 5)
            )

    return stops, movements


def write_csv(
    filename,
    rows,
    fieldnames,
):
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

    print(
        f"Generated: {output_path}"
    )
    print(
        f"Rows: {len(rows)}"
    )
    print()


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    rng = random.Random(26027)

    simulation_start = date.today()

    all_stops = []
    all_movements = []

    # Generate 7 days of representative
    # operational movement data.
    for day_offset in range(7):
        simulation_date = (
            simulation_start
            + timedelta(days=day_offset)
        )

        stops, movements = generate_for_day(
            simulation_date,
            rng,
        )

        all_stops.extend(stops)
        all_movements.extend(movements)

    write_csv(
        "train_stops.csv",
        all_stops,
        [
            "stop_id",
            "movement_id",
            "train_id",
            "station_code",
            "arrival_time",
            "departure_time",
            "stop_duration_minutes",
        ],
    )

    write_csv(
        "train_movements.csv",
        all_movements,
        [
            "movement_id",
            "movement_date",
            "train_id",
            "section_code",
            "direction",
            "entry_time",
            "exit_time",
            "entry_km",
            "exit_km",
            "train_priority",
        ],
    )

    print(
        "Train stop and movement datasets "
        "generated successfully."
    )


if __name__ == "__main__":
    main()