"""
KrishiRakshak — Backend API Server

FastAPI application entrypoint for the KrishiRakshak portal.
Integrates Scan Reports, Community Outbreak Alerts, and Analytics endpoints.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import engine, Base
from .routes import scans, outbreaks, stats, auth
from .routes import diagnosis

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables if not existing (ideal for quick start / demo)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Farmers Crop Disease Diagnostic and Regional Outbreak Reporting Portal",
    lifespan=lifespan,
)

# Enable CORS for dashboard and mobile web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router)
app.include_router(scans.router)
app.include_router(outbreaks.router)
app.include_router(stats.router)
app.include_router(diagnosis.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ── Clean Application Web Routes & Static Mounting ────────────────────────────
import os
from fastapi import Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

dashboard_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dashboard"))

if os.path.exists(dashboard_dir):
    # Public Root: Landing Page
    @app.get("/", response_class=FileResponse, include_in_schema=False)
    async def serve_landing():
        return FileResponse(os.path.join(dashboard_dir, "index.html"))

    # Unified Login & Role Selection
    @app.get("/login", response_class=FileResponse, include_in_schema=False)
    async def serve_login():
        return FileResponse(os.path.join(dashboard_dir, "login.html"))

    # Farmer Application & Sub-routes
    @app.get("/farmer", response_class=FileResponse, include_in_schema=False)
    @app.get("/farmer/predict", response_class=FileResponse, include_in_schema=False)
    @app.get("/farmer/history", response_class=FileResponse, include_in_schema=False)
    @app.get("/farmer/community", response_class=FileResponse, include_in_schema=False)
    @app.get("/farmer/nearby", response_class=FileResponse, include_in_schema=False)
    async def serve_farmer():
        return FileResponse(os.path.join(dashboard_dir, "farmer.html"))

    # Officer Portal & Sub-routes
    @app.get("/officer", response_class=FileResponse, include_in_schema=False)
    @app.get("/officer/reports", response_class=FileResponse, include_in_schema=False)
    @app.get("/officer/map", response_class=FileResponse, include_in_schema=False)
    @app.get("/officer/analytics", response_class=FileResponse, include_in_schema=False)
    async def serve_officer():
        return FileResponse(os.path.join(dashboard_dir, "officer.html"))

    # Custom 404 handler
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        if not request.url.path.startswith("/api/"):
            not_found_page = os.path.join(dashboard_dir, "404.html")
            if os.path.exists(not_found_page):
                return FileResponse(not_found_page, status_code=404)
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    # Static assets fallback (CSS, JS, 3D GLB models, images, vendor libraries)
    app.mount("/", StaticFiles(directory=dashboard_dir, html=True), name="dashboard")

