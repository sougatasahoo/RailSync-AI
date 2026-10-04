from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dashboard import router as dashboard_router
from app.api.maintenance import router as maintenance_router
from app.api.opportunities import router as opportunities_router
from app.api.planning import router as planning_router
from app.database.database import create_database


app = FastAPI(
    title="RailSync AI",
    description="AI-powered railway block planning and maintenance coordination system",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    create_database()


app.include_router(dashboard_router)
app.include_router(maintenance_router)
app.include_router(opportunities_router)
app.include_router(planning_router)


@app.get("/")
def root():
    return {
        "system": "RailSync AI",
        "status": "operational",
        "message": "Railway block planning API is running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
    }