"""Settings API — read and write runtime configuration stored in .env."""
from __future__ import annotations

import os
import sys
import re
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _get_env_path() -> str:
    """Return the absolute path to the .env file (works in dev and frozen exe)."""
    if getattr(sys, "frozen", False):
        base_dir = os.path.dirname(sys.executable)
    else:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base_dir, ".env")


def _read_env_file(path: str) -> dict[str, str]:
    """Parse a .env file into a dict, preserving all entries."""
    result: dict[str, str] = {}
    if not os.path.exists(path):
        return result
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                result[key.strip()] = value.strip()
    return result


def _write_env_file(path: str, data: dict[str, str]) -> None:
    """Write a dict back to a .env file, keeping keys in a stable order."""
    # Preserve any keys that already exist in that file but aren't in our dict
    existing = _read_env_file(path)
    merged = {**existing, **data}
    lines = [f"{k}={v}" for k, v in merged.items()]
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


def _mask(value: str) -> str:
    """Return a masked version of a secret (first 4 chars visible)."""
    if not value:
        return ""
    if len(value) <= 4:
        return "*" * len(value)
    return value[:4] + "*" * (len(value) - 4)


# ─── Response/request models ──────────────────────────────────────────────────

class SettingsResponse(BaseModel):
    gmail_user: str
    gmail_app_password_masked: str
    gemini_key_1_masked: str
    gemini_key_2_masked: str
    gemini_key_1_set: bool
    gemini_key_2_set: bool


class SettingsUpdateRequest(BaseModel):
    gmail_user: str = ""
    gmail_app_password: str = ""
    gemini_key_1: str = ""
    gemini_key_2: str = ""


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=SettingsResponse)
async def get_settings():
    """Return current (partially masked) configuration values."""
    from backend.config import GMAIL_USER, GMAIL_APP_PASSWORD, GEMINI_KEY_1, GEMINI_KEY_2
    return SettingsResponse(
        gmail_user=GMAIL_USER,
        gmail_app_password_masked=_mask(GMAIL_APP_PASSWORD),
        gemini_key_1_masked=_mask(GEMINI_KEY_1),
        gemini_key_2_masked=_mask(GEMINI_KEY_2),
        gemini_key_1_set=bool(GEMINI_KEY_1),
        gemini_key_2_set=bool(GEMINI_KEY_2),
    )


@router.post("", response_model=SettingsResponse)
async def update_settings(body: SettingsUpdateRequest):
    """
    Persist new credentials to .env and hot-reload config (no restart needed).
    Empty strings are ignored — only non-empty fields are written.
    """
    env_path = _get_env_path()
    updates: dict[str, str] = {}
    if body.gmail_user:
        updates["GMAIL_USER"] = body.gmail_user
    if body.gmail_app_password:
        updates["GMAIL_APP_PASSWORD"] = body.gmail_app_password
    if body.gemini_key_1:
        updates["GEMINI_KEY_1"] = body.gemini_key_1
    if body.gemini_key_2:
        updates["GEMINI_KEY_2"] = body.gemini_key_2

    if updates:
        _write_env_file(env_path, updates)
        from backend.config import reload_config
        reload_config()

    from backend.config import GMAIL_USER, GMAIL_APP_PASSWORD, GEMINI_KEY_1, GEMINI_KEY_2
    return SettingsResponse(
        gmail_user=GMAIL_USER,
        gmail_app_password_masked=_mask(GMAIL_APP_PASSWORD),
        gemini_key_1_masked=_mask(GEMINI_KEY_1),
        gemini_key_2_masked=_mask(GEMINI_KEY_2),
        gemini_key_1_set=bool(GEMINI_KEY_1),
        gemini_key_2_set=bool(GEMINI_KEY_2),
    )
