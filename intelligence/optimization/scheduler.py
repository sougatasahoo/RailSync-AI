from pathlib import Path

import pandas as pd
from ortools.sat.python import cp_model


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

PRIORITIZED_FILE = (
    PROJECT_ROOT
    / "data"
    / "prioritized_data"
    / "prioritized_maintenance.csv"
)

OPPORTUNITY_FILE = (
    PROJECT_ROOT
    / "data"
    / "opportunities"
    / "joint_opportunities.csv"
)

BLOCK_WINDOWS_FILE = (
    PROJECT_ROOT
    / "data"
    / "operational_data"
    / "block_windows.csv"
)


# ============================================================
# PROTOTYPE PLANNING CONFIGURATION
# ============================================================

PLANNING_START = 8 * 60       # 08:00
PLANNING_END = 18 * 60        # 18:00

MAX_BLOCK_DURATION = 240      # 4 hours

MIN_OPPORTUNITY_SCORE = 80

MAX_OPPORTUNITIES = 12

MIN_OPPORTUNITIES_SELECTED = 1

# Synthetic prototype assumption.
#
# If two compatible jobs each take 120 minutes:
#
# Individual total = 240 minutes
# Joint duration   = 180 minutes
# Time saved       = 60 minutes
#
# This is a prototype assumption and must not be presented
# as measured Indian Railways operational data.
OVERLAP_FACTOR = 0.50


# ============================================================
# TIME HELPERS
# ============================================================

def time_to_minutes(value) -> int:
    """
    Convert HH:MM into minutes from midnight.
    """

    text = str(value).strip()

    hour, minute = map(
        int,
        text.split(":")[:2],
    )

    return hour * 60 + minute


def minutes_to_time(value: int) -> str:
    """
    Convert minutes from midnight into HH:MM.
    """

    hour = value // 60
    minute = value % 60

    return f"{hour:02d}:{minute:02d}"


# ============================================================
# DATA LOADING
# ============================================================

def load_data():
    """
    Load the generated RailSync datasets.
    """

    if not PRIORITIZED_FILE.exists():
        raise FileNotFoundError(
            f"Prioritized data not found: "
            f"{PRIORITIZED_FILE}"
        )

    if not OPPORTUNITY_FILE.exists():
        raise FileNotFoundError(
            f"Opportunity data not found: "
            f"{OPPORTUNITY_FILE}"
        )

    if not BLOCK_WINDOWS_FILE.exists():
        raise FileNotFoundError(
            f"Block-window data not found: "
            f"{BLOCK_WINDOWS_FILE}"
        )

    prioritized = pd.read_csv(
        PRIORITIZED_FILE
    )

    opportunities = pd.read_csv(
        OPPORTUNITY_FILE
    )

    block_windows = pd.read_csv(
        BLOCK_WINDOWS_FILE
    )

    return (
        prioritized,
        opportunities,
        block_windows,
    )


# ============================================================
# JOB DURATION
# ============================================================

def get_job_duration(row) -> int:
    """
    Get the estimated individual maintenance duration.

    The function first checks the generated dataset for a
    duration field.

    If no duration field exists, the prototype uses 60 minutes
    as a transparent fallback.
    """

    possible_columns = [
        "estimated_duration_minutes",
        "duration_minutes",
        "maintenance_duration_minutes",
    ]

    for column in possible_columns:

        if column not in row.index:
            continue

        try:

            duration = int(
                float(
                    row[column]
                )
            )

            return max(
                30,
                min(
                    duration,
                    180,
                ),
            )

        except (
            ValueError,
            TypeError,
        ):
            continue

    return 60


# ============================================================
# JOINT DURATION
# ============================================================

def calculate_joint_duration(
    duration_a: int,
    duration_b: int,
) -> int:
    """
    Estimate the coordinated duration of two compatible jobs.

    Formula:

        max(A, B)
        + (1 - OVERLAP_FACTOR) * min(A, B)

    Example with 50% overlap:

        A = 120 minutes
        B = 120 minutes

        Joint =
            120 + (1 - 0.50) * 120
          = 180 minutes

    This is a synthetic prototype assumption.
    """

    longer = max(
        duration_a,
        duration_b,
    )

    shorter = min(
        duration_a,
        duration_b,
    )

    joint_duration = (
        longer
        + int(
            shorter
            * (
                1 - OVERLAP_FACTOR
            )
        )
    )

    return max(
        longer,
        joint_duration,
    )


# ============================================================
# OPPORTUNITY PREPARATION
# ============================================================

def build_opportunity_candidates(
    prioritized: pd.DataFrame,
    opportunities: pd.DataFrame,
) -> pd.DataFrame:
    """
    Convert detected opportunity pairs into optimization
    candidates.

    Each candidate represents a pair of compatible jobs.
    """

    priority_lookup = (
        prioritized
        .drop_duplicates(
            subset=["request_id"]
        )
        .set_index("request_id")
    )

    candidates = []

    for _, opportunity in opportunities.iterrows():

        opportunity_score = float(
            opportunity.get(
                "opportunity_score",
                0,
            )
        )

        if (
            opportunity_score
            < MIN_OPPORTUNITY_SCORE
        ):
            continue

        job_a_id = str(
            opportunity[
                "job_1_request_id"
            ]
        )

        job_b_id = str(
            opportunity[
                "job_2_request_id"
            ]
        )

        if (
            job_a_id
            not in priority_lookup.index
        ):
            continue

        if (
            job_b_id
            not in priority_lookup.index
        ):
            continue

        job_a = priority_lookup.loc[
            job_a_id
        ]

        job_b = priority_lookup.loc[
            job_b_id
        ]

        duration_a = get_job_duration(
            job_a
        )

        duration_b = get_job_duration(
            job_b
        )

        joint_duration = (
            calculate_joint_duration(
                duration_a,
                duration_b,
            )
        )

        individual_total = (
            duration_a
            + duration_b
        )

        time_saved = (
            individual_total
            - joint_duration
        )

        priority_a = float(
            job_a.get(
                "ml_priority_score",
                job_a.get(
                    "priority_score",
                    0,
                ),
            )
        )

        priority_b = float(
            job_b.get(
                "ml_priority_score",
                job_b.get(
                    "priority_score",
                    0,
                ),
            )
        )

        candidates.append(
            {
                "opportunity_id": opportunity[
                    "opportunity_id"
                ],

                "section_code": opportunity[
                    "section_code"
                ],

                "section_name": opportunity.get(
                    "section_name",
                    "",
                ),

                "job_1_request_id": job_a_id,

                "job_2_request_id": job_b_id,

                "job_1_department": opportunity[
                    "job_1_department"
                ],

                "job_2_department": opportunity[
                    "job_2_department"
                ],

                "job_1_work": opportunity[
                    "job_1_defect_type"
                ],

                "job_2_work": opportunity[
                    "job_2_defect_type"
                ],

                "job_1_resource": opportunity[
                    "job_1_resource"
                ],

                "job_2_resource": opportunity[
                    "job_2_resource"
                ],

                "job_1_priority": priority_a,

                "job_2_priority": priority_b,

                "opportunity_score":
                    opportunity_score,

                "spatial_distance_km":
                    float(
                        opportunity[
                            "spatial_distance_km"
                        ]
                    ),

                "duration_job_1_minutes":
                    duration_a,

                "duration_job_2_minutes":
                    duration_b,

                "individual_total_minutes":
                    individual_total,

                "joint_duration_minutes":
                    joint_duration,

                "time_saved_minutes":
                    time_saved,
            }
        )

    result = pd.DataFrame(
        candidates
    )

    if result.empty:
        return result

    result = result.sort_values(
        by=[
            "opportunity_score",
            "time_saved_minutes",
        ],
        ascending=[
            False,
            False,
        ],
    )

    return result.head(
        MAX_OPPORTUNITIES
    ).reset_index(
        drop=True
    )


# ============================================================
# OPERATIONAL BLOCK WINDOW
# ============================================================

def get_section_window(
    block_windows: pd.DataFrame,
    section_code: str,
) -> tuple[int, int]:
    """
    Find the best usable operational block window.

    The RailSync prototype planning horizon is:

        08:00–18:00

    Windows outside that horizon are ignored.

    Example:

        00:30–03:00  -> ignored
        03:30–05:00  -> ignored
        10:30–12:30  -> usable
        12:45–14:30  -> usable
        22:30–23:59  -> ignored

    Among usable windows, the longest window is selected.
    """

    section_windows = block_windows[
        block_windows[
            "section_code"
        ]
        == section_code
    ].copy()

    if section_windows.empty:

        return (
            PLANNING_START,
            PLANNING_END,
        )

    windows = []

    for _, row in section_windows.iterrows():

        try:

            start = time_to_minutes(
                row["start_time"]
            )

            end = time_to_minutes(
                row["end_time"]
            )

            if end <= start:
                continue

            # Intersect operational window with
            # RailSync planning horizon.
            usable_start = max(
                start,
                PLANNING_START,
            )

            usable_end = min(
                end,
                PLANNING_END,
            )

            if usable_end <= usable_start:
                continue

            preferred = str(
                row.get(
                    "preferred_for_maintenance",
                    "",
                )
            ).strip().lower()

            preferred_score = (
                1
                if preferred == "yes"
                else 0
            )

            windows.append(
                {
                    "start":
                        usable_start,

                    "end":
                        usable_end,

                    "duration":
                        usable_end
                        - usable_start,

                    "preferred":
                        preferred_score,
                }
            )

        except (
            ValueError,
            TypeError,
            KeyError,
        ):
            continue

    if not windows:

        return (
            PLANNING_START,
            PLANNING_END,
        )

    # Longest usable window first.
    # Maintenance preference is used as a secondary criterion.
    selected = max(
        windows,
        key=lambda item: (
            item["duration"],
            item["preferred"],
        ),
    )

    return (
        selected["start"],
        selected["end"],
    )


# ============================================================
# CP-SAT OPTIMIZATION
# ============================================================

def optimize_block_plan(
    planning_period: str = "Today",
) -> dict:
    """
    Optimize detected joint maintenance opportunities.

    CP-SAT decides which opportunity pairs should be selected
    and where they fit within an operational block.

    The optimizer considers:

    - joint opportunity score
    - individual job duration
    - estimated joint duration
    - time saved
    - request uniqueness
    - resource conflicts
    - operational block window
    """

    (
        prioritized,
        opportunities,
        block_windows,
    ) = load_data()

    candidates = build_opportunity_candidates(
        prioritized,
        opportunities,
    )

    if candidates.empty:

        return {
            "planning_period":
                planning_period,

            "status":
                "No joint opportunities",

            "solver":
                "Google OR-Tools CP-SAT",

            "jobs": [],
        }

    # --------------------------------------------------------
    # Select section with strongest opportunity.
    # --------------------------------------------------------

    section_code = (
        candidates
        .groupby(
            "section_code"
        )[
            "opportunity_score"
        ]
        .max()
        .sort_values(
            ascending=False
        )
        .index[0]
    )

    candidates = candidates[
        candidates[
            "section_code"
        ]
        == section_code
    ].copy()

    candidates = candidates.reset_index(
        drop=True
    )

    # --------------------------------------------------------
    # Find usable operational window.
    # --------------------------------------------------------

    window_start, window_end = (
        get_section_window(
            block_windows,
            section_code,
        )
    )

    if window_end <= window_start:

        return {
            "planning_period":
                planning_period,

            "status":
                "No usable block window",

            "solver":
                "Google OR-Tools CP-SAT",

            "section_code":
                section_code,

            "jobs": [],
        }

    available_minutes = (
        window_end
        - window_start
    )

    block_duration = min(
        MAX_BLOCK_DURATION,
        available_minutes,
    )

    if block_duration <= 0:

        return {
            "planning_period":
                planning_period,

            "status":
                "No usable block window",

            "solver":
                "Google OR-Tools CP-SAT",

            "section_code":
                section_code,

            "jobs": [],
        }

    latest_block_start = (
        window_end
        - block_duration
    )

    # --------------------------------------------------------
    # Create CP-SAT model.
    # --------------------------------------------------------

    model = cp_model.CpModel()

    block_start = model.NewIntVar(
        window_start,
        latest_block_start,
        "block_start",
    )

    block_end = model.NewIntVar(
        window_start
        + block_duration,
        window_end,
        "block_end",
    )

    model.Add(
        block_end
        == block_start
        + block_duration
    )

    selection_vars = []

    start_vars = []

    end_vars = []

    interval_vars = []

    resource_map = {}

    for index, opportunity in (
        candidates.iterrows()
    ):

        joint_duration = int(
            opportunity[
                "joint_duration_minutes"
            ]
        )

        # Ignore opportunities that cannot fit.
        if (
            joint_duration
            > block_duration
        ):
            continue

        selected = model.NewBoolVar(
            f"selected_{index}"
        )

        start = model.NewIntVar(
            window_start,
            window_end
            - joint_duration,
            f"start_{index}",
        )

        end = model.NewIntVar(
            window_start
            + joint_duration,
            window_end,
            f"end_{index}",
        )

        interval = (
            model.NewOptionalIntervalVar(
                start,
                joint_duration,
                end,
                selected,
                f"interval_{index}",
            )
        )

        # Selected opportunity must fit completely
        # inside the common block.
        model.Add(
            start >= block_start
        ).OnlyEnforceIf(
            selected
        )

        model.Add(
            end <= block_end
        ).OnlyEnforceIf(
            selected
        )

        selection_vars.append(
            selected
        )

        start_vars.append(
            start
        )

        end_vars.append(
            end
        )

        interval_vars.append(
            interval
        )

        resource_map[index] = [
            str(
                opportunity[
                    "job_1_resource"
                ]
            ),
            str(
                opportunity[
                    "job_2_resource"
                ]
            ),
        ]

    if not selection_vars:

        return {
            "planning_period":
                planning_period,

            "status":
                "No opportunities fit block window",

            "solver":
                "Google OR-Tools CP-SAT",

            "section_code":
                section_code,

            "jobs": [],
        }

    # --------------------------------------------------------
    # At least one opportunity must be selected.
    # --------------------------------------------------------

    model.Add(
        sum(selection_vars)
        >= MIN_OPPORTUNITIES_SELECTED
    )

    # --------------------------------------------------------
    # A maintenance request cannot appear in multiple
    # selected opportunities.
    # --------------------------------------------------------

    request_to_candidates = {}

    for index, opportunity in (
        candidates.iterrows()
    ):

        # Candidate may have been skipped if it was
        # longer than the block window.
        if index >= len(selection_vars):
            continue

        for request_id in [
            opportunity[
                "job_1_request_id"
            ],
            opportunity[
                "job_2_request_id"
            ],
        ]:

            request_to_candidates.setdefault(
                request_id,
                [],
            ).append(index)

    for (
        request_id,
        indices,
    ) in request_to_candidates.items():

        valid_indices = [
            index
            for index in indices
            if index < len(
                selection_vars
            )
        ]

        if len(valid_indices) > 1:

            model.Add(
                sum(
                    selection_vars[index]
                    for index in valid_indices
                )
                <= 1
            )

    # --------------------------------------------------------
    # Same resources cannot overlap.
    # --------------------------------------------------------

    resource_to_intervals = {}

    for index, resources in (
        resource_map.items()
    ):

        if index >= len(
            interval_vars
        ):
            continue

        for resource in resources:

            resource_to_intervals.setdefault(
                resource,
                [],
            ).append(
                interval_vars[index]
            )

    for (
        resource,
        intervals,
    ) in resource_to_intervals.items():

        if len(intervals) > 1:

            model.AddNoOverlap(
                intervals
            )

    # --------------------------------------------------------
    # Objective
    #
    # Reward:
    #
    # 1. maintenance priority
    # 2. opportunity quality
    # 3. time saved
    # --------------------------------------------------------

    objective_terms = []

    for index, opportunity in (
        candidates.iterrows()
    ):

        if index >= len(
            selection_vars
        ):
            continue

        priority_total = (
            float(
                opportunity[
                    "job_1_priority"
                ]
            )
            + float(
                opportunity[
                    "job_2_priority"
                ]
            )
        )

        opportunity_score = float(
            opportunity[
                "opportunity_score"
            ]
        )

        time_saved = float(
            opportunity[
                "time_saved_minutes"
            ]
        )

        objective_value = int(
            priority_total * 100
            + opportunity_score * 50
            + time_saved * 100
        )

        objective_terms.append(
            objective_value
            * selection_vars[index]
        )

    model.Maximize(
        sum(
            objective_terms
        )
    )

    # --------------------------------------------------------
    # Solve.
    # --------------------------------------------------------

    solver = cp_model.CpSolver()

    solver.parameters.max_time_in_seconds = 5

    solver.parameters.num_search_workers = 1

    status = solver.Solve(
        model
    )

    status_name = solver.StatusName(
        status
    )

    if status not in (
        cp_model.OPTIMAL,
        cp_model.FEASIBLE,
    ):

        return {
            "planning_period":
                planning_period,

            "status":
                status_name,

            "solver":
                "Google OR-Tools CP-SAT",

            "planning_horizon":
                "08:00–18:00",

            "section_code":
                section_code,

            "jobs": [],

            "constraints_checked": [
                "Joint opportunity selection",
                "Individual maintenance duration",
                "Joint maintenance duration",
                "Shared access time saving",
                "Request uniqueness",
                "Resource compatibility",
                "Operational block window",
            ],
        }

    # --------------------------------------------------------
    # Extract selected opportunities.
    # --------------------------------------------------------

    selected_indices = [
        index
        for index in range(
            len(selection_vars)
        )
        if solver.Value(
            selection_vars[index]
        )
        == 1
    ]

    if not selected_indices:

        return {
            "planning_period":
                planning_period,

            "status":
                "No opportunities selected",

            "solver":
                "Google OR-Tools CP-SAT",

            "section_code":
                section_code,

            "jobs": [],
        }

    solved_block_start = (
        solver.Value(
            block_start
        )
    )

    solved_block_end = (
        solver.Value(
            block_end
        )
    )

    selected_opportunities = []

    total_individual_minutes = 0

    total_joint_minutes = 0

    total_time_saved = 0

    # --------------------------------------------------------
    # Build final plan.
    # --------------------------------------------------------

    for index in selected_indices:

        opportunity = candidates.iloc[
            index
        ]

        individual_minutes = int(
            opportunity[
                "individual_total_minutes"
            ]
        )

        joint_minutes = int(
            opportunity[
                "joint_duration_minutes"
            ]
        )

        saved_minutes = int(
            opportunity[
                "time_saved_minutes"
            ]
        )

        total_individual_minutes += (
            individual_minutes
        )

        total_joint_minutes += (
            joint_minutes
        )

        total_time_saved += (
            saved_minutes
        )

        selected_opportunities.append(
            {
                "opportunity_id":
                    opportunity[
                        "opportunity_id"
                    ],

                "job_1_request_id":
                    opportunity[
                        "job_1_request_id"
                    ],

                "job_2_request_id":
                    opportunity[
                        "job_2_request_id"
                    ],

                "section_code":
                    section_code,

                "opportunity_score":
                    round(
                        float(
                            opportunity[
                                "opportunity_score"
                            ]
                        ),
                        2,
                    ),

                "individual_duration_minutes":
                    individual_minutes,

                "joint_duration_minutes":
                    joint_minutes,

                "time_saved_minutes":
                    saved_minutes,

                "spatial_distance_km":
                    round(
                        float(
                            opportunity[
                                "spatial_distance_km"
                            ]
                        ),
                        3,
                    ),

                "start_time":
                    minutes_to_time(
                        solver.Value(
                            start_vars[index]
                        )
                    ),

                "end_time":
                    minutes_to_time(
                        solver.Value(
                            end_vars[index]
                        )
                    ),

                "jobs": [
                    {
                        "request_id":
                            opportunity[
                                "job_1_request_id"
                            ],

                        "department":
                            opportunity[
                                "job_1_department"
                            ],

                        "work":
                            opportunity[
                                "job_1_work"
                            ],

                        "resource":
                            opportunity[
                                "job_1_resource"
                            ],

                        "priority":
                            round(
                                float(
                                    opportunity[
                                        "job_1_priority"
                                    ]
                                ),
                                2,
                            ),
                    },
                    {
                        "request_id":
                            opportunity[
                                "job_2_request_id"
                            ],

                        "department":
                            opportunity[
                                "job_2_department"
                            ],

                        "work":
                            opportunity[
                                "job_2_work"
                            ],

                        "resource":
                            opportunity[
                                "job_2_resource"
                            ],

                        "priority":
                            round(
                                float(
                                    opportunity[
                                        "job_2_priority"
                                    ]
                                ),
                                2,
                            ),
                    },
                ],
            }
        )

    # --------------------------------------------------------
    # Final response.
    # --------------------------------------------------------

    return {
        "planning_period":
            planning_period,

        "plan": {
            "status":
                status_name,

            "solver":
                "Google OR-Tools CP-SAT",

            "planning_horizon":
                "08:00–18:00",

            "section_code":
                section_code,

            "block": {
                "start_time":
                    minutes_to_time(
                        solved_block_start
                    ),

                "end_time":
                    minutes_to_time(
                        solved_block_end
                    ),

                "duration_minutes":
                    (
                        solved_block_end
                        - solved_block_start
                    ),
            },

            "optimization_summary": {
                "opportunities_selected":
                    len(
                        selected_opportunities
                    ),

                "individual_work_minutes":
                    total_individual_minutes,

                "joint_work_minutes":
                    total_joint_minutes,

                "time_saved_minutes":
                    total_time_saved,
            },

            "opportunities":
                selected_opportunities,

            "constraints_checked": [
                "Joint opportunity selection",
                "Individual maintenance duration",
                "Joint maintenance duration",
                "Shared access time saving",
                "Request uniqueness",
                "Resource compatibility",
                "Operational block window",
            ],
        },
    }


# ============================================================
# COMMAND-LINE TEST
# ============================================================

if __name__ == "__main__":

    result = optimize_block_plan()

    print(
        "=============================================="
    )

    print(
        "RAILSYNC AI — JOINT BLOCK OPTIMIZER"
    )

    print(
        "=============================================="
    )

    if "plan" not in result:

        print(
            f"Status: "
            f"{result['status']}"
        )

        print(
            f"Solver: "
            f"{result['solver']}"
        )

        print(
            f"Section: "
            f"{result.get('section_code', 'N/A')}"
        )

    else:

        plan = result["plan"]

        print(
            f"Status: "
            f"{plan['status']}"
        )

        print(
            f"Solver: "
            f"{plan['solver']}"
        )

        print(
            f"Section: "
            f"{plan['section_code']}"
        )

        block = plan["block"]

        print(
            f"Block: "
            f"{block['start_time']}–"
            f"{block['end_time']}"
        )

        summary = (
            plan[
                "optimization_summary"
            ]
        )

        print(
            f"Opportunities selected: "
            f"{summary['opportunities_selected']}"
        )

        print(
            f"Individual work: "
            f"{summary['individual_work_minutes']} min"
        )

        print(
            f"Joint work: "
            f"{summary['joint_work_minutes']} min"
        )

        print(
            f"Time saved: "
            f"{summary['time_saved_minutes']} min"
        )

        print()

        for opportunity in (
            plan[
                "opportunities"
            ]
        ):

            print(
                f"{opportunity['opportunity_id']} | "
                f"{opportunity['job_1_request_id']} + "
                f"{opportunity['job_2_request_id']} | "
                f"{opportunity['start_time']}–"
                f"{opportunity['end_time']} | "
                f"Individual: "
                f"{opportunity['individual_duration_minutes']} "
                f"min | "
                f"Joint: "
                f"{opportunity['joint_duration_minutes']} "
                f"min | "
                f"Saved: "
                f"{opportunity['time_saved_minutes']} min"
            )