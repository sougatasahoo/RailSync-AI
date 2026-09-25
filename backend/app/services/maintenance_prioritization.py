from __future__ import annotations

from datetime import date
from typing import Any

import numpy as np
import pandas as pd
import shap
from xgboost import XGBRegressor

from app.services.data_fusion import build_fused_dataset


# ============================================================
# RailSync AI - Maintenance Prioritization Service
# ============================================================
# First intelligence layer after Data Fusion.
#
# Current prototype datasets are synthetic and do not contain
# historical outcome labels. Therefore, a transparent
# domain-based score is used as the training target for the
# lightweight XGBoost model.
#
# Later, real historical maintenance outcomes can replace
# this synthetic target.
# ============================================================


PRIORITY_WEIGHTS = {
    "Critical": 1.00,
    "High": 0.75,
    "Medium": 0.50,
    "Low": 0.25,
}


FEATURE_COLUMNS = [
    "priority_weight",
    "due_date_urgency",
    "operational_impact_score",
    "block_required_score",
    "duration_pressure",
    "window_availability",
    "machine_availability",
    "material_readiness",
]


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """Convert a value to float safely."""

    try:
        if pd.isna(value):
            return default

        return float(value)

    except (TypeError, ValueError):
        return default


def _date_urgency(due_date: Any) -> float:
    """
    Convert due-date proximity into an urgency score.

    The current date is used as the reference point.
    """

    if pd.isna(due_date):
        return 0.0

    try:
        if isinstance(due_date, date):
            due = due_date
        else:
            due = pd.to_datetime(
                due_date,
                errors="coerce",
            ).date()

        days_until_due = (
            due - date.today()
        ).days

    except (
        TypeError,
        ValueError,
        AttributeError,
    ):
        return 0.0

    if days_until_due <= 0:
        return 1.0

    if days_until_due <= 1:
        return 0.95

    if days_until_due <= 2:
        return 0.85

    if days_until_due <= 4:
        return 0.70

    if days_until_due <= 7:
        return 0.50

    if days_until_due <= 14:
        return 0.30

    return 0.15


def _priority_weight(priority: Any) -> float:
    """Convert categorical priority into a numeric value."""

    return PRIORITY_WEIGHTS.get(
        str(priority),
        0.25,
    )


def _operational_impact_score(
    operational_impact: Any,
) -> float:
    """Convert operational impact into a numeric score."""

    text = str(
        operational_impact
        if not pd.isna(operational_impact)
        else ""
    ).lower()

    if any(
        keyword in text
        for keyword in (
            "critical",
            "major",
            "high",
            "severe",
        )
    ):
        return 1.0

    if any(
        keyword in text
        for keyword in (
            "moderate",
            "medium",
            "restricted",
        )
    ):
        return 0.65

    if any(
        keyword in text
        for keyword in (
            "low",
            "minor",
            "limited",
        )
    ):
        return 0.35

    return 0.50


def _block_required_score(
    block_required: Any,
) -> float:
    """Convert block requirement into planning pressure."""

    if isinstance(block_required, bool):
        return 1.0 if block_required else 0.25

    return (
        1.0
        if str(block_required).lower() == "true"
        else 0.25
    )


def _duration_pressure(
    duration_hours: Any,
) -> float:
    """Estimate planning pressure from maintenance duration."""

    duration = _safe_float(duration_hours)

    if duration >= 4:
        return 1.0

    if duration >= 3:
        return 0.80

    if duration >= 2:
        return 0.60

    if duration >= 1:
        return 0.40

    return 0.20


def _window_availability_score(
    record: dict,
) -> float:
    """Score availability of feasible operational windows."""

    feasible_windows = record.get(
        "feasible_operational_windows",
        [],
    )

    candidate_windows = record.get(
        "candidate_operational_windows",
        [],
    )

    if feasible_windows:
        return min(
            1.0,
            0.50 + 0.10 * len(feasible_windows),
        )

    if candidate_windows:
        return 0.25

    return 0.0


def _machine_availability_score(
    record: dict,
) -> float:
    """Score availability of suitable machines."""

    available = record.get(
        "available_machines",
        [],
    )

    matching = record.get(
        "matching_machines",
        [],
    )

    if available:
        return min(
            1.0,
            0.60 + 0.10 * len(available),
        )

    if matching:
        return 0.25

    required_machine = record.get(
        "required_machine"
    )

    if (
        required_machine is None
        or str(required_machine).strip() == ""
    ):
        return 0.50

    return 0.0


def _material_readiness_score(
    record: dict,
) -> float:
    """Score material readiness."""

    required_materials = str(
        record.get(
            "required_materials",
            "",
        )
    ).strip()

    if not required_materials:
        return 0.75

    warnings = record.get(
        "material_warnings",
        [],
    )

    if warnings:
        return 0.25

    return 1.0


def build_feature_record(
    record: dict,
) -> dict[str, float]:
    """Build numerical features for one maintenance request."""

    return {
        "priority_weight": _priority_weight(
            record.get("priority")
        ),
        "due_date_urgency": _date_urgency(
            record.get("due_date")
        ),
        "operational_impact_score": (
            _operational_impact_score(
                record.get(
                    "operational_impact",
                    "",
                )
            )
        ),
        "block_required_score": (
            _block_required_score(
                record.get("block_required")
            )
        ),
        "duration_pressure": _duration_pressure(
            record.get(
                "estimated_duration_hours"
            )
        ),
        "window_availability": (
            _window_availability_score(record)
        ),
        "machine_availability": (
            _machine_availability_score(record)
        ),
        "material_readiness": (
            _material_readiness_score(record)
        ),
    }


def calculate_domain_priority_score(
    features: dict[str, float],
) -> float:
    """
    Build a transparent domain-based priority target.

    Higher values indicate greater planning urgency.
    """

    score = (
        features["priority_weight"] * 0.30
        + features["due_date_urgency"] * 0.22
        + features["operational_impact_score"] * 0.18
        + features["block_required_score"] * 0.10
        + features["duration_pressure"] * 0.06
        + features["window_availability"] * 0.06
        + features["machine_availability"] * 0.04
        + features["material_readiness"] * 0.04
    )

    return float(
        max(
            0.0,
            min(
                1.0,
                score,
            ),
        )
    )


def _priority_category(
    score: float,
) -> str:
    """Convert numerical score into an operational category."""

    if score >= 0.80:
        return "Critical"

    if score >= 0.65:
        return "High"

    if score >= 0.45:
        return "Medium"

    return "Low"


def _generate_reasons(
    record: dict,
    features: dict[str, float],
) -> list[str]:
    """Generate human-readable priority reasons."""

    reasons: list[str] = []

    if features["priority_weight"] >= 0.75:
        reasons.append(
            f"{record.get('priority')} maintenance priority"
        )

    if features["due_date_urgency"] >= 0.70:
        reasons.append(
            "Due date requires near-term attention"
        )

    if features["operational_impact_score"] >= 0.80:
        reasons.append(
            "High operational impact"
        )

    if features["block_required_score"] >= 1.0:
        reasons.append(
            "Maintenance requires an operational block"
        )

    if features["window_availability"] == 0.0:
        reasons.append(
            "No feasible operational window currently matched"
        )

    if features["machine_availability"] < 0.50:
        reasons.append(
            "Machine availability is constrained"
        )

    if features["material_readiness"] < 0.50:
        reasons.append(
            "Material readiness requires attention"
        )

    if not reasons:
        reasons.append(
            "Routine planning priority based on available data"
        )

    return reasons


def _build_training_frame(
    records: list[dict],
) -> pd.DataFrame:
    """Build the model training frame."""

    rows = []

    for record in records:
        features = build_feature_record(record)

        rows.append(
            {
                **features,
                "target_score": (
                    calculate_domain_priority_score(
                        features
                    )
                ),
            }
        )

    return pd.DataFrame(rows)


def train_priority_model(
    records: list[dict],
) -> tuple[XGBRegressor, pd.DataFrame]:
    """Train the lightweight XGBoost priority model."""

    training_frame = _build_training_frame(records)

    X = training_frame[
        FEATURE_COLUMNS
    ]

    y = training_frame[
        "target_score"
    ]

    model = XGBRegressor(
        n_estimators=80,
        max_depth=3,
        learning_rate=0.08,
        subsample=0.90,
        colsample_bytree=0.90,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=2,
    )

    model.fit(
        X,
        y,
    )

    return model, training_frame


def _build_shap_explanation(
    model: XGBRegressor,
    feature_values: pd.DataFrame,
) -> list[dict]:
    """
    Generate SHAP feature contributions for one request.
    """

    try:
        explainer = shap.TreeExplainer(
            model
        )

        shap_values = explainer(
            feature_values
        )

        values = np.asarray(
            shap_values.values
        )

        if values.ndim == 2:
            values = values[0]

        explanations = []

        for feature_name, contribution in zip(
            FEATURE_COLUMNS,
            values,
        ):
            explanations.append(
                {
                    "feature": feature_name,
                    "contribution": round(
                        float(contribution),
                        4,
                    ),
                    "direction": (
                        "increases"
                        if contribution >= 0
                        else "reduces"
                    ),
                }
            )

        explanations.sort(
            key=lambda item: abs(
                item["contribution"]
            ),
            reverse=True,
        )

        return explanations

    except Exception:
        return []


def prioritize_maintenance_requests() -> list[dict]:
    """
    Run the complete maintenance prioritization pipeline.
    """

    fused_records = build_fused_dataset()

    if not fused_records:
        return []

    model, _ = train_priority_model(
        fused_records
    )

    feature_rows = [
        build_feature_record(record)
        for record in fused_records
    ]

    feature_frame = pd.DataFrame(
        feature_rows,
        columns=FEATURE_COLUMNS,
    )

    predictions = model.predict(
        feature_frame
    )

    results = []

    for index, record in enumerate(
        fused_records
    ):
        features = feature_rows[index]

        model_score = float(
            max(
                0.0,
                min(
                    1.0,
                    predictions[index],
                ),
            )
        )

        category = _priority_category(
            model_score
        )

        # Explicitly create a one-row DataFrame.
        # This avoids the dimensionality issue caused by
        # nested indexing with .iloc[[index]] in the current
        # Pandas environment.
        feature_input = feature_frame.iloc[
            index:index + 1
        ].copy()

        shap_explanations = (
            _build_shap_explanation(
                model,
                feature_input,
            )
        )

        enriched_record = {
            **record,
            "priority_score": round(
                model_score * 100,
                2,
            ),
            "priority_category": category,
            "priority_reasons": _generate_reasons(
                record,
                features,
            ),
            "priority_features": {
                key: round(
                    float(value),
                    4,
                )
                for key, value in features.items()
            },
            "shap_explanations": (
                shap_explanations
            ),
        }

        results.append(
            enriched_record
        )

    results.sort(
        key=lambda record: record[
            "priority_score"
        ],
        reverse=True,
    )

    return results


def get_prioritization_summary() -> dict:
    """Return summary statistics."""

    records = prioritize_maintenance_requests()

    category_counts = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0,
    }

    for record in records:
        category = record[
            "priority_category"
        ]

        if category in category_counts:
            category_counts[category] += 1

    return {
        "total_requests": len(records),
        "critical_requests": category_counts[
            "Critical"
        ],
        "high_requests": category_counts[
            "High"
        ],
        "medium_requests": category_counts[
            "Medium"
        ],
        "low_requests": category_counts[
            "Low"
        ],
        "top_priority_request": (
            records[0]["request_id"]
            if records
            else None
        ),
    }