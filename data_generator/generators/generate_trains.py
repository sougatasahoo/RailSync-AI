from pathlib import Path
import csv


PROJECT_ROOT = Path(__file__).resolve().parents[2]

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "operational_data"
)


TRAINS = [
    {
        "train_id": "TRN-12001",
        "train_number": "12001",
        "train_name": "Howrah–Kharagpur Express",
        "service_type": "Express",
        "origin": "HWH",
        "destination": "KGP",
        "direction": "Down",
        "priority_class": "High",
        "avg_speed_kmph": 75,
    },
    {
        "train_id": "TRN-12002",
        "train_number": "12002",
        "train_name": "Kharagpur–Howrah Express",
        "service_type": "Express",
        "origin": "KGP",
        "destination": "HWH",
        "direction": "Up",
        "priority_class": "High",
        "avg_speed_kmph": 75,
    },
    {
        "train_id": "TRN-12801",
        "train_number": "12801",
        "train_name": "Puri–New Delhi Superfast",
        "service_type": "Superfast",
        "origin": "KGP",
        "destination": "HWH",
        "direction": "Up",
        "priority_class": "Very High",
        "avg_speed_kmph": 85,
    },
    {
        "train_id": "TRN-12802",
        "train_number": "12802",
        "train_name": "New Delhi–Puri Superfast",
        "service_type": "Superfast",
        "origin": "HWH",
        "destination": "KGP",
        "direction": "Down",
        "priority_class": "Very High",
        "avg_speed_kmph": 85,
    },
    {
        "train_id": "TRN-18001",
        "train_number": "18001",
        "train_name": "Howrah–Kharagpur Local",
        "service_type": "Passenger",
        "origin": "HWH",
        "destination": "KGP",
        "direction": "Down",
        "priority_class": "Medium",
        "avg_speed_kmph": 50,
    },
    {
        "train_id": "TRN-18002",
        "train_number": "18002",
        "train_name": "Kharagpur–Howrah Local",
        "service_type": "Passenger",
        "origin": "KGP",
        "destination": "HWH",
        "direction": "Up",
        "priority_class": "Medium",
        "avg_speed_kmph": 50,
    },
    {
        "train_id": "TRN-22641",
        "train_number": "22641",
        "train_name": "Chennai–Howrah Superfast",
        "service_type": "Superfast",
        "origin": "KGP",
        "destination": "HWH",
        "direction": "Up",
        "priority_class": "Very High",
        "avg_speed_kmph": 82,
    },
    {
        "train_id": "TRN-22642",
        "train_number": "22642",
        "train_name": "Howrah–Chennai Superfast",
        "service_type": "Superfast",
        "origin": "HWH",
        "destination": "KGP",
        "direction": "Down",
        "priority_class": "Very High",
        "avg_speed_kmph": 82,
    },
    {
        "train_id": "TRN-58001",
        "train_number": "58001",
        "train_name": "Howrah–Kharagpur Passenger",
        "service_type": "Passenger",
        "origin": "HWH",
        "destination": "GID",
        "direction": "Down",
        "priority_class": "Medium",
        "avg_speed_kmph": 45,
    },
    {
        "train_id": "TRN-58002",
        "train_number": "58002",
        "train_name": "Gidni–Howrah Passenger",
        "service_type": "Passenger",
        "origin": "GID",
        "destination": "HWH",
        "direction": "Up",
        "priority_class": "Medium",
        "avg_speed_kmph": 45,
    },
    {
        "train_id": "TRN-68001",
        "train_number": "68001",
        "train_name": "Kharagpur–Gidni Local",
        "service_type": "Passenger",
        "origin": "KGP",
        "destination": "GID",
        "direction": "Down",
        "priority_class": "Low",
        "avg_speed_kmph": 40,
    },
    {
        "train_id": "TRN-68002",
        "train_number": "68002",
        "train_name": "Gidni–Kharagpur Local",
        "service_type": "Passenger",
        "origin": "GID",
        "destination": "KGP",
        "direction": "Up",
        "priority_class": "Low",
        "avg_speed_kmph": 40,
    },
    {
        "train_id": "TRN-FRT01",
        "train_number": "FRT01",
        "train_name": "Freight Service 01",
        "service_type": "Freight",
        "origin": "HWH",
        "destination": "KGP",
        "direction": "Down",
        "priority_class": "Low",
        "avg_speed_kmph": 40,
    },
    {
        "train_id": "TRN-FRT02",
        "train_number": "FRT02",
        "train_name": "Freight Service 02",
        "service_type": "Freight",
        "origin": "KGP",
        "destination": "HWH",
        "direction": "Up",
        "priority_class": "Low",
        "avg_speed_kmph": 40,
    },
    {
        "train_id": "TRN-FRT03",
        "train_number": "FRT03",
        "train_name": "Freight Service 03",
        "service_type": "Freight",
        "origin": "HWH",
        "destination": "GID",
        "direction": "Down",
        "priority_class": "Low",
        "avg_speed_kmph": 38,
    },
    {
        "train_id": "TRN-FRT04",
        "train_number": "FRT04",
        "train_name": "Freight Service 04",
        "service_type": "Freight",
        "origin": "GID",
        "destination": "HWH",
        "direction": "Up",
        "priority_class": "Low",
        "avg_speed_kmph": 38,
    },
]


TIMETABLE = [
    # Express services
    {
        "train_id": "TRN-12001",
        "service_day": "Daily",
        "departure": "06:10",
        "arrival": "08:30",
        "operational_window": "06:00-09:00",
    },
    {
        "train_id": "TRN-12002",
        "service_day": "Daily",
        "departure": "17:10",
        "arrival": "19:30",
        "operational_window": "17:00-20:00",
    },

    # Superfast services
    {
        "train_id": "TRN-12801",
        "service_day": "Daily",
        "departure": "05:45",
        "arrival": "08:15",
        "operational_window": "05:30-08:30",
    },
    {
        "train_id": "TRN-12802",
        "service_day": "Daily",
        "departure": "20:15",
        "arrival": "22:45",
        "operational_window": "20:00-23:00",
    },
    {
        "train_id": "TRN-22641",
        "service_day": "Daily",
        "departure": "07:20",
        "arrival": "09:50",
        "operational_window": "07:00-10:00",
    },
    {
        "train_id": "TRN-22642",
        "service_day": "Daily",
        "departure": "18:40",
        "arrival": "21:10",
        "operational_window": "18:30-21:30",
    },

    # Passenger services
    {
        "train_id": "TRN-18001",
        "service_day": "Daily",
        "departure": "08:00",
        "arrival": "11:00",
        "operational_window": "07:45-11:15",
    },
    {
        "train_id": "TRN-18002",
        "service_day": "Daily",
        "departure": "15:00",
        "arrival": "18:00",
        "operational_window": "14:45-18:15",
    },
    {
        "train_id": "TRN-58001",
        "service_day": "Daily",
        "departure": "09:00",
        "arrival": "14:00",
        "operational_window": "08:45-14:15",
    },
    {
        "train_id": "TRN-58002",
        "service_day": "Daily",
        "departure": "14:30",
        "arrival": "19:30",
        "operational_window": "14:15-19:45",
    },
    {
        "train_id": "TRN-68001",
        "service_day": "Daily",
        "departure": "10:00",
        "arrival": "12:30",
        "operational_window": "09:45-12:45",
    },
    {
        "train_id": "TRN-68002",
        "service_day": "Daily",
        "departure": "16:00",
        "arrival": "18:30",
        "operational_window": "15:45-18:45",
    },

    # Freight services
    {
        "train_id": "TRN-FRT01",
        "service_day": "Daily",
        "departure": "11:00",
        "arrival": "15:30",
        "operational_window": "10:45-15:45",
    },
    {
        "train_id": "TRN-FRT02",
        "service_day": "Daily",
        "departure": "12:00",
        "arrival": "16:30",
        "operational_window": "11:45-16:45",
    },
    {
        "train_id": "TRN-FRT03",
        "service_day": "Daily",
        "departure": "13:00",
        "arrival": "18:00",
        "operational_window": "12:45-18:15",
    },
    {
        "train_id": "TRN-FRT04",
        "service_day": "Daily",
        "departure": "14:00",
        "arrival": "19:00",
        "operational_window": "13:45-19:15",
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
        "trains.csv",
        TRAINS,
        [
            "train_id",
            "train_number",
            "train_name",
            "service_type",
            "origin",
            "destination",
            "direction",
            "priority_class",
            "avg_speed_kmph",
        ],
    )

    write_csv(
        "timetable.csv",
        TIMETABLE,
        [
            "train_id",
            "service_day",
            "departure",
            "arrival",
            "operational_window",
        ],
    )

    print("Train and timetable datasets generated successfully.")


if __name__ == "__main__":
    main()