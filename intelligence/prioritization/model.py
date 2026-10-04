from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor


PROJECT_ROOT = Path(__file__).resolve().parents[2]

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

MODEL_DIR = (
    PROJECT_ROOT
    / "intelligence"
    / "prioritization"
    / "artifacts"
)

MODEL_PATH = (
    MODEL_DIR
    / "priority_model.joblib"
)

SCORED_DATA_PATH = (
    OUTPUT_DIR
    / "prioritized_maintenance.csv"
)


FEATURE_COLUMNS = [
    "priority_score",
    "severity_score",
    "duration_minutes",
    "days_to_due",
    "km",
    "is_cluster_candidate",
]


def load_fused_data():
    if not FUSED_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Fused dataset not found: {FUSED_DATA_PATH}"
        )

    return pd.read_csv(FUSED_DATA_PATH)


def prepare_features(df):
    features = df[FEATURE_COLUMNS].copy()

    features["is_cluster_candidate"] = (
        features["is_cluster_candidate"]
        .astype(int)
    )

    features["days_to_due"] = (
        pd.to_numeric(
            features["days_to_due"],
            errors="coerce",
        )
        .fillna(0)
        .clip(lower=0)
    )

    features["severity_score"] = (
        pd.to_numeric(
            features["severity_score"],
            errors="coerce",
        )
        .fillna(0)
    )

    features["duration_minutes"] = (
        pd.to_numeric(
            features["duration_minutes"],
            errors="coerce",
        )
        .fillna(0)
    )

    features["priority_score"] = (
        pd.to_numeric(
            features["priority_score"],
            errors="coerce",
        )
        .fillna(0)
    )

    features["km"] = (
        pd.to_numeric(
            features["km"],
            errors="coerce",
        )
        .fillna(0)
    )

    return features


def create_training_target(df):
    """
    Create an expert-defined synthetic target for the
    prototype model.

    This is NOT a real Indian Railways historical label.

    Higher urgency comes from:
    - source priority
    - defect severity
    - shorter time to due date
    - maintenance clustering

    Duration and location are included as contextual
    features but are not directly used to create the target.
    """

    priority_component = (
        df["priority_score"] * 0.45
    )

    severity_component = (
        df["severity_score"] * 0.35
    )

    urgency_component = (
        (14 - df["days_to_due"].clip(upper=14))
        / 14
        * 100
        * 0.15
    )

    cluster_component = (
        df["is_cluster_candidate"].astype(int)
        * 5
    )

    target = (
        priority_component
        + severity_component
        + urgency_component
        + cluster_component
    )

    return target.clip(0, 100)


def train_model():
    print("Loading fused maintenance data...")

    df = load_fused_data()

    print(
        f"Records loaded: {len(df)}"
    )

    features = prepare_features(df)

    target = create_training_target(df)

    X_train, X_test, y_train, y_test = (
        train_test_split(
            features,
            target,
            test_size=0.20,
            random_state=26027,
        )
    )

    model = XGBRegressor(
        n_estimators=180,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="reg:squarederror",
        random_state=26027,
        n_jobs=1,
    )

    print("Training XGBoost prioritization model...")

    model.fit(
        X_train,
        y_train,
    )

    predictions = model.predict(X_test)

    mae = mean_absolute_error(
        y_test,
        predictions,
    )

    r2 = r2_score(
        y_test,
        predictions,
    )

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    print()
    print("Model evaluation:")
    print(
        f"Mean Absolute Error: {mae:.2f}"
    )
    print(
        f"R² Score: {r2:.4f}"
    )

    return model


def generate_priority_scores(model, df):
    features = prepare_features(df)

    predictions = model.predict(
        features
    )

    scored = df.copy()

    scored["ml_priority_score"] = (
        pd.Series(
            predictions,
            index=scored.index,
        )
        .clip(0, 100)
        .round(2)
    )

    scored["priority_rank"] = (
        scored["ml_priority_score"]
        .rank(
            ascending=False,
            method="first",
        )
        .astype(int)
    )

    scored = scored.sort_values(
        "ml_priority_score",
        ascending=False,
    ).reset_index(
        drop=True
    )

    scored["priority_rank"] = range(
        1,
        len(scored) + 1,
    )

    return scored


def run_prioritization():
    print("==============================================")
    print("RAILSYNC AI — XGBOOST PRIORITIZATION")
    print("==============================================")

    df = load_fused_data()

    model = train_model()

    print()
    print("Generating ML priority scores...")

    scored = generate_priority_scores(
        model,
        df,
    )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    scored.to_csv(
        SCORED_DATA_PATH,
        index=False,
    )

    print()
    print(
        f"Scored records: {len(scored)}"
    )

    print()
    print("Top 10 prioritized requests:")

    print(
        scored[
            [
                "priority_rank",
                "request_id",
                "department",
                "defect_type",
                "priority",
                "ml_priority_score",
                "mapped_section_code",
            ]
        ]
        .head(10)
        .to_string(index=False)
    )

    print()
    print(
        f"Model artifact: {MODEL_PATH}"
    )

    print(
        f"Output: {SCORED_DATA_PATH}"
    )

    print()
    print(
        "XGBoost prioritization completed successfully."
    )

    return scored


if __name__ == "__main__":
    run_prioritization()