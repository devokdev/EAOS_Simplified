from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .database import connect_db, disconnect_db
from .routes import automation, dashboard_v2, datasets, logbook, templates, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="EAOS Email Automation",
    description="Minimal dataset-first email automation with Supabase, Gmail, and AI reply assistance",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router)
app.include_router(templates.router)
app.include_router(automation.router)
app.include_router(logbook.router)
app.include_router(dashboard_v2.router)
app.include_router(settings.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "EAOS"}


frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
frontend_dist = os.path.join(frontend_dir, "dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith(("api/", "docs", "redoc", "openapi.json", "health")):
            raise HTTPException(404, "Not found")
        requested_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(requested_path):
            return FileResponse(requested_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
