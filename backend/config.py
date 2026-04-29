import os
import sys
from dotenv import load_dotenv

load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/db")
GEMINI_KEY_1 = os.getenv("GEMINI_KEY_1", "")
GEMINI_KEY_2 = os.getenv("GEMINI_KEY_2", "")
GEMINI_KEYS = [k for k in [GEMINI_KEY_1, GEMINI_KEY_2] if k]
GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


def reload_config() -> None:
    """Re-read .env and refresh all module-level config variables in-place."""
    import importlib
    # Determine .env path — works both in dev and frozen PyInstaller exe
    if getattr(sys, "frozen", False):
        base_dir = os.path.dirname(sys.executable)
    else:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")
    load_dotenv(dotenv_path=env_path, override=True)

    # Refresh this module's globals
    current_module = sys.modules[__name__]
    current_module.GEMINI_KEY_1 = os.getenv("GEMINI_KEY_1", "")
    current_module.GEMINI_KEY_2 = os.getenv("GEMINI_KEY_2", "")
    current_module.GEMINI_KEYS = [
        k for k in [current_module.GEMINI_KEY_1, current_module.GEMINI_KEY_2] if k
    ]
    current_module.GMAIL_USER = os.getenv("GMAIL_USER", "")
    current_module.GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
