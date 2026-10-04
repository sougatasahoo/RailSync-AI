from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = (
    PROJECT_ROOT
    / "data"
    / "operational_data"
)

SECTIONS_FILE = (
    DATA_DIR
    / "sections.csv"
)

BLOCK_WINDOWS_FILE = (
    DATA_DIR
    / "block_windows.csv"
)

TRAFFIC_CONSTRAINTS_FILE = (
    DATA_DIR
    / "traffic_constraints.csv"
)

SPECIAL_EVENTS_FILE = (
    DATA_DIR
    / "special_operational_events.csv"
)


DEFAULT_DATE = "2026-10-02"


def generate_block_windows(
    sections: pd.DataFrame,
) -> pd.DataFrame:
    """
    Generate representative maintenance block windows.

    These are synthetic operational constraints for the
    RailSync prototype.
    """

    windows = []

    window_definitions = [
        (
            "00:30",
            "03:00",
            "Night maintenance window",
            "High",
            "Yes",
        ),
        (
            "03:30",
            "05:00",
            "Pre-service maintenance window",
            "Medium",
            "Yes",
        ),
        (
            "10:30",
            "12:30",
            "Midday maintenance window",
            "Low",
            "Conditional",
        ),
        (
            "12:45",
            "14:30",
            "Afternoon maintenance window",
            "Low",
            "Conditional",
        ),
        (
            "22:30",
            "23:59",
            "Late-night maintenance window",
            "Low",
            "Conditional",
        ),
    ]

    counter = 1

    for _, section in sections.iterrows():

        section_code = section[
            "section_code"
        ]

        section_name = section[
            "section_name"
        ]

        for (
            start_time,
            end_time,
            window_type,
            capacity,
            preferred,
        ) in window_definitions:

            windows.append(
                {
                    "block_window_id": (
                        f"BLK-{DEFAULT_DATE.replace('-', '')}-"
                        f"{counter:04d}"
                    ),
                    "window_date": DEFAULT_DATE,
                    "section_code": section_code,
                    "section_name": section_name,
                    "start_time": start_time,
                    "end_time": end_time,
                    "window_type": window_type,
                    "capacity": capacity,
                    "preferred_for_maintenance": preferred,
                }
            )

            counter += 1

    return pd.DataFrame(windows)


def generate_traffic_constraints(
    sections: pd.DataFrame,
) -> pd.DataFrame:
    """
    Generate representative traffic constraints.
    """

    constraints = []

    constraint_definitions = [
        (
            "06:00",
            "08:00",
            "Morning peak traffic",
            "High",
        ),
        (
            "08:00",
            "10:30",
            "Operational traffic",
            "Medium",
        ),
        (
            "17:00",
            "20:00",
            "Evening peak traffic",
            "High",
        ),
        (
            "20:00",
            "22:00",
            "Reduced traffic",
            "Medium",
        ),
    ]

    counter = 1

    for _, section in sections.iterrows():

        for (
            start_time,
            end_time,
            constraint_type,
            severity,
        ) in constraint_definitions:

            constraints.append(
                {
                    "traffic_constraint_id": (
                        f"TRF-{DEFAULT_DATE.replace('-', '')}-"
                        f"{counter:04d}"
                    ),
                    "window_date": DEFAULT_DATE,
                    "section_code": section[
                        "section_code"
                    ],
                    "section_name": section[
                        "section_name"
                    ],
                    "start_time": start_time,
                    "end_time": end_time,
                    "constraint_type": constraint_type,
                    "severity": severity,
                }
            )

            counter += 1

    return pd.DataFrame(
        constraints
    )


def generate_special_events() -> pd.DataFrame:
    """
    Generate representative operational events.
    """

    events = [
        {
            "event_id": "EVT-001",
            "event_date": DEFAULT_DATE,
            "event_type": "Festival traffic",
            "description": (
                "Higher passenger movement expected "
                "during selected operating periods."
            ),
            "severity": "Medium",
        },
        {
            "event_id": "EVT-002",
            "event_date": DEFAULT_DATE,
            "event_type": "VIP movement",
            "description": (
                "Temporary operational priority may "
                "restrict maintenance access."
            ),
            "severity": "High",
        },
        {
            "event_id": "EVT-003",
            "event_date": DEFAULT_DATE,
            "event_type": "Planned engineering activity",
            "description": (
                "Representative engineering work "
                "affecting selected sections."
            ),
            "severity": "Medium",
        },
    ]

    return pd.DataFrame(events)


def main():
    print(
        "=============================================="
    )
    print(
        "RAILSYNC AI — OPERATIONAL CONSTRAINT GENERATOR"
    )
    print(
        "=============================================="
    )

    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    sections = pd.read_csv(
        SECTIONS_FILE
    )

    block_windows = generate_block_windows(
        sections
    )

    traffic_constraints = (
        generate_traffic_constraints(
            sections
        )
    )

    special_events = (
        generate_special_events()
    )

    block_windows.to_csv(
        BLOCK_WINDOWS_FILE,
        index=False,
    )

    traffic_constraints.to_csv(
        TRAFFIC_CONSTRAINTS_FILE,
        index=False,
    )

    special_events.to_csv(
        SPECIAL_EVENTS_FILE,
        index=False,
    )

    print(
        f"Block windows generated: "
        f"{len(block_windows)}"
    )

    print(
        f"Traffic constraints generated: "
        f"{len(traffic_constraints)}"
    )

    print(
        f"Special events generated: "
        f"{len(special_events)}"
    )

    print()
    print(
        "Sample block windows:"
    )

    print(
        block_windows.head(5).to_string(
            index=False
        )
    )

    print()
    print(
        f"Output: {BLOCK_WINDOWS_FILE}"
    )

    print(
        "Operational constraint generation "
        "completed successfully."
    )


if __name__ == "__main__":
    main()