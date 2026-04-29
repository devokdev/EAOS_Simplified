import os
import sys
import threading
import webbrowser
import uvicorn


def _resource_base() -> str:
    """Return the base directory for bundled resources.

    In a frozen PyInstaller exe this is the directory that contains the .exe.
    In development it is the project root (parent of this file).
    """
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def _open_browser(url: str, delay: float = 1.5) -> None:
    """Open the default browser after a short delay (gives uvicorn time to bind)."""
    import time
    time.sleep(delay)
    webbrowser.open(url)


if __name__ == "__main__":
    # Ensure .env next to the exe/script is loaded first
    base = _resource_base()
    env_path = os.path.join(base, ".env")
    if os.path.exists(env_path):
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=env_path, override=True)

    # When frozen, tell the backend where frontend/dist lives
    if getattr(sys, "frozen", False):
        # PyInstaller unpacks data files into sys._MEIPASS
        # but we want the exe-relative path for the frontend
        dist_path = os.path.join(base, "frontend", "dist")
        os.environ.setdefault("EAOS_FRONTEND_DIST", dist_path)

    host = "127.0.0.1"
    port = 8000
    url = f"http://{host}:{port}"

    # Open browser in background thread
    threading.Thread(target=_open_browser, args=(url,), daemon=True).start()

    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=not getattr(sys, "frozen", False),  # no reload in frozen exe
    )
