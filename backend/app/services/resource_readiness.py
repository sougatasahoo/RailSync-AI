from __future__ import annotations

from typing import Any

from app.services.data_fusion import (
    load_machine_data,
    load_manpower_data,
    load_material_data,
)


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        number = float(value)

        if number != number:
            return default

        return number

    except (TypeError, ValueError):
        return default


def _safe_int(
    value: Any,
    default: int = 0,
) -> int:
    try:
        return int(float(value))

    except (TypeError, ValueError):
        return default


def _resource_status(
    available: float,
    required: float,
) -> str:
    """
    Determine prototype resource-readiness status.

    Rules:
    - Ready: available >= required
    - Limited: some availability exists but requirement
      is not fully covered
    - Unavailable: no usable availability
    """

    if required <= 0:
        return "Ready"

    if available >= required:
        return "Ready"

    if available > 0:
        return "Limited"

    return "Unavailable"


def _calculate_percentage(
    available: float,
    required: float,
) -> float:
    if required <= 0:
        return 100.0

    percentage = (
        available / required
    ) * 100.0

    return round(
        max(
            0.0,
            min(
                100.0,
                percentage,
            ),
        ),
        1,
    )


def _build_manpower_readiness() -> list[dict]:
    manpower = load_manpower_data()

    records = []

    for _, row in manpower.iterrows():
        max_hours = _safe_float(
            row.get("max_daily_hours")
        )

        assigned_hours = _safe_float(
            row.get("assigned_hours")
        )

        remaining_hours = _safe_float(
            row.get("remaining_hours")
        )

        status = str(
            row.get(
                "availability_status",
                "Unknown",
            )
        )

        if status == "Unavailable":
            readiness_status = "Unavailable"

        elif remaining_hours > 0:
            readiness_status = "Ready"

        else:
            readiness_status = "Limited"

        records.append(
            {
                "resource_id": str(
                    row.get(
                        "employee_id",
                        "",
                    )
                ),
                "name": str(
                    row.get(
                        "employee_name",
                        "",
                    )
                ),
                "department": str(
                    row.get(
                        "department",
                        "",
                    )
                ),
                "skill": str(
                    row.get(
                        "skill",
                        "",
                    )
                ),
                "location": str(
                    row.get(
                        "location",
                        "",
                    )
                ),
                "availability_date": str(
                    row.get(
                        "availability_date",
                        "",
                    )
                ),
                "availability_status": status,
                "max_daily_hours": max_hours,
                "assigned_hours": assigned_hours,
                "remaining_hours": remaining_hours,
                "readiness_status": readiness_status,
            }
        )

    return records


def _build_machine_readiness() -> list[dict]:
    machines = load_machine_data()

    records = []

    for _, row in machines.iterrows():
        max_hours = _safe_float(
            row.get("max_daily_hours")
        )

        assigned_hours = _safe_float(
            row.get("assigned_hours")
        )

        remaining_hours = _safe_float(
            row.get("remaining_hours")
        )

        availability_status = str(
            row.get(
                "availability_status",
                "Unknown",
            )
        )

        if (
            availability_status
            == "Unavailable"
        ):
            readiness_status = "Unavailable"

        elif remaining_hours > 0:
            readiness_status = "Ready"

        else:
            readiness_status = "Limited"

        records.append(
            {
                "resource_id": str(
                    row.get(
                        "machine_id",
                        "",
                    )
                ),
                "name": str(
                    row.get(
                        "machine_id",
                        "",
                    )
                ),
                "machine_type": str(
                    row.get(
                        "machine_type",
                        "",
                    )
                ),
                "location": str(
                    row.get(
                        "location",
                        "",
                    )
                ),
                "availability_date": str(
                    row.get(
                        "availability_date",
                        "",
                    )
                ),
                "maintenance_due_date": str(
                    row.get(
                        "maintenance_due_date",
                        "",
                    )
                ),
                "availability_status": availability_status,
                "max_daily_hours": max_hours,
                "assigned_hours": assigned_hours,
                "remaining_hours": remaining_hours,
                "readiness_status": readiness_status,
            }
        )

    return records


def _build_material_readiness() -> list[dict]:
    materials = load_material_data()

    records = []

    for _, row in materials.iterrows():
        available_quantity = _safe_float(
            row.get(
                "available_quantity"
            )
        )

        reserved_quantity = _safe_float(
            row.get(
                "reserved_quantity"
            )
        )

        usable_quantity = _safe_float(
            row.get(
                "usable_quantity"
            )
        )

        reorder_level = _safe_float(
            row.get(
                "reorder_level"
            )
        )

        availability_status = str(
            row.get(
                "availability_status",
                "Unknown",
            )
        )

        if (
            availability_status
            == "Unavailable"
            or usable_quantity <= 0
        ):
            readiness_status = "Unavailable"

        elif usable_quantity <= reorder_level:
            readiness_status = "Limited"

        else:
            readiness_status = "Ready"

        records.append(
            {
                "resource_id": str(
                    row.get(
                        "material_id",
                        "",
                    )
                ),
                "name": str(
                    row.get(
                        "material_name",
                        "",
                    )
                ),
                "category": str(
                    row.get(
                        "category",
                        "",
                    )
                ),
                "location": str(
                    row.get(
                        "location",
                        "",
                    )
                ),
                "availability_status": availability_status,
                "available_quantity": available_quantity,
                "reserved_quantity": reserved_quantity,
                "usable_quantity": usable_quantity,
                "reorder_level": reorder_level,
                "last_updated": str(
                    row.get(
                        "last_updated",
                        "",
                    )
                ),
                "readiness_status": readiness_status,
            }
        )

    return records


def _count_statuses(
    records: list[dict],
) -> dict[str, int]:
    counts = {
        "ready": 0,
        "limited": 0,
        "unavailable": 0,
    }

    for record in records:
        status = str(
            record.get(
                "readiness_status",
                "",
            )
        ).lower()

        if status in counts:
            counts[status] += 1

    return counts


def _calculate_overall_readiness(
    manpower: list[dict],
    machines: list[dict],
    materials: list[dict],
) -> float:
    """
    Calculate an overall prototype readiness percentage.

    The calculation treats each resource record as one
    readiness unit:
      Ready = 100%
      Limited = 50%
      Unavailable = 0%
    """

    all_records = (
        manpower
        + machines
        + materials
    )

    if not all_records:
        return 0.0

    score = 0.0

    for record in all_records:
        status = str(
            record.get(
                "readiness_status",
                "",
            )
        )

        if status == "Ready":
            score += 100.0

        elif status == "Limited":
            score += 50.0

    return round(
        score / len(all_records),
        1,
    )


def get_resource_readiness() -> dict:
    """
    Build the complete Resource Readiness response.
    """

    manpower = _build_manpower_readiness()

    machines = _build_machine_readiness()

    materials = _build_material_readiness()

    manpower_counts = _count_statuses(
        manpower
    )

    machine_counts = _count_statuses(
        machines
    )

    material_counts = _count_statuses(
        materials
    )

    overall_readiness = (
        _calculate_overall_readiness(
            manpower,
            machines,
            materials,
        )
    )

    total_resources = (
        len(manpower)
        + len(machines)
        + len(materials)
    )

    ready_resources = (
        manpower_counts["ready"]
        + machine_counts["ready"]
        + material_counts["ready"]
    )

    limited_resources = (
        manpower_counts["limited"]
        + machine_counts["limited"]
        + material_counts["limited"]
    )

    unavailable_resources = (
        manpower_counts["unavailable"]
        + machine_counts["unavailable"]
        + material_counts["unavailable"]
    )

    return {
        "status": "success",
        "overall_readiness": overall_readiness,
        "summary": {
            "total_resources": total_resources,
            "ready_resources": ready_resources,
            "limited_resources": limited_resources,
            "unavailable_resources": (
                unavailable_resources
            ),
        },
        "manpower": {
            "total": len(manpower),
            "ready": manpower_counts["ready"],
            "limited": manpower_counts["limited"],
            "unavailable": manpower_counts[
                "unavailable"
            ],
            "resources": manpower,
        },
        "machines": {
            "total": len(machines),
            "ready": machine_counts["ready"],
            "limited": machine_counts["limited"],
            "unavailable": machine_counts[
                "unavailable"
            ],
            "resources": machines,
        },
        "materials": {
            "total": len(materials),
            "ready": material_counts["ready"],
            "limited": material_counts["limited"],
            "unavailable": material_counts[
                "unavailable"
            ],
            "resources": materials,
        },
    }


def get_resource_readiness_summary() -> dict:
    """
    Return only the summary metrics needed by dashboards.
    """

    result = get_resource_readiness()

    return {
        "status": result["status"],
        "overall_readiness": result[
            "overall_readiness"
        ],
        **result["summary"],
        "manpower": {
            "total": result["manpower"]["total"],
            "ready": result["manpower"]["ready"],
            "limited": result["manpower"]["limited"],
            "unavailable": result[
                "manpower"
            ]["unavailable"],
        },
        "machines": {
            "total": result["machines"]["total"],
            "ready": result["machines"]["ready"],
            "limited": result["machines"]["limited"],
            "unavailable": result[
                "machines"
            ]["unavailable"],
        },
        "materials": {
            "total": result["materials"]["total"],
            "ready": result["materials"]["ready"],
            "limited": result["materials"]["limited"],
            "unavailable": result[
                "materials"
            ]["unavailable"],
        },
    }