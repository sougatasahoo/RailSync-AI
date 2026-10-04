from fastapi import APIRouter

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("")
def get_dashboard():
    return {
        "planning_context": {
            "division": "Kharagpur Division",
            "corridor": "Howrah–Kharagpur",
            "mode": "Operational Simulation",
        },
        "summary": {
            "critical_maintenance": 12,
            "pending_requests": 187,
            "joint_opportunities": 24,
            "proposed_blocks": 8,
        },
        "pipeline": {
            "data_fusion": "Complete",
            "maintenance_prioritization": "Complete",
            "joint_opportunity_detection": "Complete",
            "block_optimization": "Complete",
            "human_approval": "Pending",
        },
        "source_feeds": [
            {
                "system": "TMS",
                "status": "Online",
                "records": 65,
            },
            {
                "system": "TDMS",
                "status": "Online",
                "records": 64,
            },
            {
                "system": "SMMS",
                "status": "Online",
                "records": 67,
            },
            {
                "system": "COA",
                "status": "Online",
                "records": 124,
            },
            {
                "system": "Resources",
                "status": "Online",
                "records": 48,
            },
        ],
        "controller_attention": {
            "pending_approval": 1,
            "critical_jobs": 12,
            "high_priority_jobs": 48,
        },
    }