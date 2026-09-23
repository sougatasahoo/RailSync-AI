from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="RailSync AI API",
    description="Railway operational decision-support backend",
    version="0.1.0",
)


# Frontend development access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    return {
        "systems": {
            "TMS": "online",
            "SMMS": "online",
            "TDMS": "online",
            "COA": "online",
            "HRMS": "online",
            "TMMMS": "online",
            "BDMS": "online",
        },
        "total_systems": 7,
        "online_systems": 7,
    }