from pathlib import Path

import pandas as pd
import shap
import joblib


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "intelligence"
    / "prioritization"
    / "artifacts"
    / "priority_model.joblib"
)

FUSED_DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "fused_data"
    / "unified_maintenance.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "prioritized_data"
)

EXPLANATION_PATH = (
    OUTPUT_DIR
    / "priority_explanations.csv"
)


FEATURE_COLUMNS = [
    "priority_score",
    "severity_score",
    "duration_minutes",
    "days_to_due",
    "km",
    "is_cluster_candidate",
]


def prepare_features(df):
    features = df[FEATURE_COLUMNS].copy()

    features["is_cluster_candidate"] = (
        features["is_cluster_candidate"]
        .astype(int)
    )

    numeric_columns = [
        "priority_score",
        "severity_score",
        "duration_minutes",
        "days_to_due",
        "km",
    ]

    for column in numeric_columns:
        features[column] = pd.to_numeric(
            features[column],
            errors="coerce",
        ).fillna(0)

    features["days_to_due"] = (
        features["days_to_due"]
        .clip(lower=0)
    )

    return features


def generate_explanations():

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Priority model not found: {MODEL_PATH}"
        )

    if not FUSED_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Fused dataset not found: {FUSED_DATA_PATH}"
        )

    print("Loading trained XGBoost model...")

    model = joblib.load(
        MODEL_PATH
    )

    df = pd.read_csv(
        FUSED_DATA_PATH
    )

    features = prepare_features(
        df
    )

    print("Calculating SHAP explanations...")

    explainer = shap.TreeExplainer(
        model
    )

    shap_values = explainer(
        features
    )

    values = shap_values.values

    explanation = pd.DataFrame(
        values,
        columns=FEATURE_COLUMNS,
    )

    explanation.insert(
        0,
        "request_id",
        df["request_id"].values,
    )

    explanation.insert(
        1,
        "department",
        df["department"].values,
    )

    explanation.insert(
        2,
        "defect_type",
        df["defect_type"].values,
    )

    explanation.insert(
        3,
        "priority",
        df["priority"].values,
    )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    explanation.to_csv(
        EXPLANATION_PATH,
        index=False,
    )

    print()
    print(
        f"Explanation records: {len(explanation)}"
    )

    print(
        f"Output: {EXPLANATION_PATH}"
    )

    print()
    print(
        "SHAP explanations generated successfully."
    )

    return explanation


if __name__ == "__main__":
    generate_explanations()