from pathlib import Path

import uvicorn
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.app import create_app
from src.settings import get_settings

app = create_app()

# Serve React build — MUST come last, after all API routes
STATIC_DIR = Path(__file__).parent / "static"

if STATIC_DIR.exists():
    if (STATIC_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        return FileResponse(STATIC_DIR / "index.html")


def run_app():
    uvicorn.run(
        app,
        host=get_settings().app_settings.app_host,
        port=get_settings().app_settings.app_port,
        reload=get_settings().app_settings.debug,
        workers=get_settings().app_settings.workers,
        log_level=get_settings().log_settings.log_level.lower(),
        limit_concurrency=get_settings().app_settings.http_max_connections,
        timeout_graceful_shutdown=get_settings().app_settings.timeout_graceful_shutdown,
    )


if __name__ == "__main__":
    run_app()
