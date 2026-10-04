from pathlib import Path

import pandas as pd

from intelligence.fusion.loader import (
    load_maintenance_feeds,
    load_sections,
)

from intelligence.fusion.normalizer import (
    normalize_maintenance,
    map_to_sections,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "fused_data"
)


OUTPUT_FILE = (
    OUTPUT_DIR
    / "unified_maintenance.csv"
)


def run_fusion():
    """
    Execute the complete RailSync data-fusion pipeline.

    Pipeline:

        TMS + TDMS + SMMS
                ↓
        Common schema validation
                ↓
        Normalization
                ↓
        Priority/severity features
                ↓
        Railway section mapping
                ↓
        Unified maintenance dataset
    """

    print("==============================================")
    print("RAILSYNC AI — DATA FUSION ENGINE")
    print("==============================================")

    print()
    print("1. Loading maintenance feeds...")

    maintenance = load_maintenance_feeds()

    print(
        f"   Loaded records: {len(maintenance)}"
    )

    print()
    print("2. Normalizing maintenance feeds...")

    normalized = normalize_maintenance(
        maintenance
    )

    print(
        f"   Normalized records: {len(normalized)}"
    )

    print()
    print("3. Loading railway section master...")

    sections = load_sections()

    print(
        f"   Railway sections: {len(sections)}"
    )

    print()
    print("4. Mapping maintenance requests to sections...")

    fused = map_to_sections(
        normalized,
        sections,
    )

    print()
    print("5. Creating fused dataset...")

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    fused.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print(
        f"   Output records: {len(fused)}"
    )

    print()
    print("==============================================")
    print("FUSION SUMMARY")
    print("==============================================")

    print()
    print("Department distribution:")

    print(
        fused["department"]
        .value_counts()
        .to_string()
    )

    print()
    print("Priority distribution:")

    print(
        fused["priority"]
        .value_counts()
        .to_string()
    )

    cluster_count = int(
        fused["is_cluster_candidate"].sum()
    )

    mapped_count = int(
        (
            fused["mapped_section_code"]
            != "UNMAPPED"
        ).sum()
    )

    unmapped_count = int(
        (
            fused["mapped_section_code"]
            == "UNMAPPED"
        ).sum()
    )

    print()
    print(
        f"Cluster candidates: {cluster_count}"
    )

    print(
        f"Mapped records: {mapped_count}"
    )

    print(
        f"Unmapped records: {unmapped_count}"
    )

    print()
    print(
        f"Output: {OUTPUT_FILE}"
    )

    print()
    print("Data fusion completed successfully.")

    return fused


if __name__ == "__main__":
    run_fusion()