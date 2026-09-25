from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analytics import router as analytics_router
from app.api.maintenance import router as maintenance_router
from app.api.planning import router as planning_router
from app.api.resources import router as resources_router


app = FastAPI(
    title="RailSync AI API",
    description="Railway operational decision-support backend",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(maintenance_router)
app.include_router(planning_router)
app.include_router(resources_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "system": "RailSync AI",
        "status": "online",
        "message": "RailSync AI backend is running",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RailSync AI API",
    }


@app.get("/api/system-status")
def system_status():
    systems = {
        "TMS": "online",
        "SMMS": "online",
        "TDMS": "online",
        "COA": "online",
        "HRMS": "online",
        "TMMMS": "online",
        "BDMS": "online",
    }

    return {
        "systems": systems,
        "total_systems": len(systems),
        "online_systems": sum(
            1
            for status in systems.values()
            if status == "online"
        ),
    }