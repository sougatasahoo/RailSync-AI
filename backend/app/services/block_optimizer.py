from __future__ import annotations

from dataclasses import dataclass

from ortools.sat.python import cp_model

from app.services.conflict_analysis import (
    analyze_conflicts,
)
from app.services.joint_opportunity_detection import (
    detect_joint_opportunities,
)


@dataclass
class OptimizationCandidate:
    opportunity_id: str
    request_ids: list[str]
    section: str
    date: str
    window_id: str
    window_type: str
    duration_hours: float
    available_hours: float
    opportunity_score: float
    utilization_percent: float
    conflict_status: str
    can_proceed: bool


def _build_opportunity_score_map() -> dict[str, float]:
    """
    Load the original RailSync AI joint-opportunity scores.

    Conflict analysis contains operational conflict information,
    while joint opportunity detection contains the opportunity
    score. The optimizer needs both.
    """

    opportunities = detect_joint_opportunities()

    return {
        str(opportunity["opportunity_id"]): float(
            opportunity.get("opportunity_score", 0.0)
        )
        for opportunity in opportunities
    }


def _build_candidates() -> list[OptimizationCandidate]:
    """
    Convert conflict-analysis results into optimization
    candidates while preserving the original opportunity
    scores.
    """

    results = analyze_conflicts()

    opportunity_scores = (
        _build_opportunity_score_map()
    )

    candidates: list[OptimizationCandidate] = []

    for result in results:
        indicators = result[
            "operational_indicators"
        ]

        if not indicators["block_allowed"]:
            continue

        duration = float(
            indicators["required_hours"]
        )

        available = float(
            indicators["available_hours"]
        )

        if duration <= 0:
            continue

        if duration > available:
            continue

        if result["conflict_status"] == "Conflict":
            continue

        opportunity_id = str(
            result["opportunity_id"]
        )

        candidates.append(
            OptimizationCandidate(
                opportunity_id=opportunity_id,
                request_ids=[
                    str(request_id)
                    for request_id in result[
                        "request_ids"
                    ]
                ],
                section=str(
                    result["section"]
                ),
                date=str(
                    result["date"]
                ),
                window_id=str(
                    result["window_id"]
                ),
                window_type=str(
                    result["window_type"]
                ),
                duration_hours=duration,
                available_hours=available,
                opportunity_score=opportunity_scores.get(
                    opportunity_id,
                    0.0,
                ),
                utilization_percent=float(
                    indicators[
                        "utilization_percent"
                    ]
                ),
                conflict_status=str(
                    result["conflict_status"]
                ),
                can_proceed=bool(
                    result["can_proceed"]
                ),
            )
        )

    return candidates


def optimize_block_plan() -> dict:
    """
    Generate a proposed block plan using OR-Tools CP-SAT.

    Optimization goals:
    - prioritize higher RailSync AI opportunity scores
    - avoid scheduling the same maintenance request twice
    - keep work within each operational window capacity
    - avoid blocked operational windows
    """

    candidates = _build_candidates()

    if not candidates:
        return {
            "status": "no_solution",
            "message": (
                "No feasible joint opportunities "
                "are available for optimization."
            ),
            "selected_opportunities": [],
            "unscheduled_opportunities": [],
            "summary": {
                "candidate_count": 0,
                "selected_count": 0,
                "unscheduled_count": 0,
                "total_planned_hours": 0.0,
            },
        }

    model = cp_model.CpModel()

    decision_variables = []

    for index in range(len(candidates)):
        variable = model.NewBoolVar(
            f"select_{index}"
        )

        decision_variables.append(variable)

    # ---------------------------------------------------------
    # Constraint 1:
    # A maintenance request cannot appear in multiple
    # selected joint opportunities.
    # ---------------------------------------------------------

    request_to_variables: dict[
        str,
        list,
    ] = {}

    for index, candidate in enumerate(
        candidates
    ):
        for request_id in candidate.request_ids:
            request_to_variables.setdefault(
                request_id,
                [],
            ).append(
                decision_variables[index]
            )

    for variables in request_to_variables.values():
        if len(variables) > 1:
            model.Add(
                sum(variables) <= 1
            )

    # ---------------------------------------------------------
    # Constraint 2:
    # Total work assigned to one operational window
    # cannot exceed its available capacity.
    #
    # Quarter-hour units are used because CP-SAT works
    # naturally with integer coefficients.
    # ---------------------------------------------------------

    window_to_candidates: dict[
        str,
        list[tuple[int, OptimizationCandidate]],
    ] = {}

    for index, candidate in enumerate(
        candidates
    ):
        window_to_candidates.setdefault(
            candidate.window_id,
            [],
        ).append(
            (
                index,
                candidate,
            )
        )

    for window_id, window_candidates in (
        window_to_candidates.items()
    ):
        if not window_candidates:
            continue

        available_hours = (
            window_candidates[0][1]
            .available_hours
        )

        capacity_units = int(
            round(
                available_hours * 4
            )
        )

        duration_expression = []

        for index, candidate in window_candidates:
            duration_units = int(
                round(
                    candidate.duration_hours * 4
                )
            )

            duration_expression.append(
                duration_units
                * decision_variables[index]
            )

        model.Add(
            sum(duration_expression)
            <= capacity_units
        )

    # ---------------------------------------------------------
    # Objective:
    #
    # Maximize opportunity value.
    #
    # Opportunity score has the dominant weight.
    # A smaller utilization bonus prefers opportunities
    # that leave some capacity when scores are similar.
    # ---------------------------------------------------------

    objective_terms = []

    for index, candidate in enumerate(
        candidates
    ):
        score_units = int(
            round(
                candidate.opportunity_score
                * 100
            )
        )

        utilization_bonus = max(
            0,
            100
            - int(
                round(
                    candidate.utilization_percent
                )
            ),
        )

        objective_value = (
            score_units * 1000
            + utilization_bonus
        )

        objective_terms.append(
            objective_value
            * decision_variables[index]
        )

    model.Maximize(
        sum(objective_terms)
    )

    # ---------------------------------------------------------
    # Solve.
    # ---------------------------------------------------------

    solver = cp_model.CpSolver()

    solver.parameters.max_time_in_seconds = 5.0
    solver.parameters.num_search_workers = 2

    status = solver.Solve(model)

    if status not in {
        cp_model.OPTIMAL,
        cp_model.FEASIBLE,
    }:
        return {
            "status": "no_solution",
            "message": (
                "CP-SAT could not find a feasible "
                "block plan."
            ),
            "selected_opportunities": [],
            "unscheduled_opportunities": [
                candidate.opportunity_id
                for candidate in candidates
            ],
            "summary": {
                "candidate_count": len(
                    candidates
                ),
                "selected_count": 0,
                "unscheduled_count": len(
                    candidates
                ),
                "total_planned_hours": 0.0,
            },
        }

    selected = []
    unscheduled = []

    for index, candidate in enumerate(
        candidates
    ):
        if solver.Value(
            decision_variables[index]
        ):
            selected.append(candidate)
        else:
            unscheduled.append(candidate)

    selected_payload = []

    total_planned_hours = 0.0
    total_opportunity_score = 0.0

    for candidate in selected:
        total_planned_hours += (
            candidate.duration_hours
        )

        total_opportunity_score += (
            candidate.opportunity_score
        )

        selected_payload.append(
            {
                "opportunity_id": (
                    candidate.opportunity_id
                ),
                "request_ids": (
                    candidate.request_ids
                ),
                "section": candidate.section,
                "date": candidate.date,
                "window_id": candidate.window_id,
                "window_type": (
                    candidate.window_type
                ),
                "duration_hours": (
                    candidate.duration_hours
                ),
                "available_hours": (
                    candidate.available_hours
                ),
                "utilization_percent": (
                    candidate.utilization_percent
                ),
                "opportunity_score": (
                    candidate.opportunity_score
                ),
                "conflict_status": (
                    candidate.conflict_status
                ),
            }
        )

    unscheduled_payload = []

    for candidate in unscheduled:
        unscheduled_payload.append(
            {
                "opportunity_id": (
                    candidate.opportunity_id
                ),
                "request_ids": (
                    candidate.request_ids
                ),
                "section": candidate.section,
                "date": candidate.date,
                "window_id": candidate.window_id,
                "opportunity_score": (
                    candidate.opportunity_score
                ),
                "reason": (
                    "Not selected by the optimization "
                    "model because another compatible "
                    "opportunity provided higher planning "
                    "value or shared a maintenance request."
                ),
            }
        )

    return {
        "status": "optimized",
        "solver_status": (
            "OPTIMAL"
            if status == cp_model.OPTIMAL
            else "FEASIBLE"
        ),
        "selected_opportunities": selected_payload,
        "unscheduled_opportunities": (
            unscheduled_payload
        ),
        "summary": {
            "candidate_count": len(candidates),
            "selected_count": len(selected),
            "unscheduled_count": len(
                unscheduled
            ),
            "total_planned_hours": round(
                total_planned_hours,
                2,
            ),
            "total_opportunity_score": round(
                total_opportunity_score,
                2,
            ),
        },
    }