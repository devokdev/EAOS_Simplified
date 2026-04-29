"""
build_exe.py  —  One-command build script for EAOS.exe

Usage:
    python build_exe.py

What it does:
    1. Installs Python dependencies (pip install -r requirements.txt)
    2. Installs Node dependencies (npm install) inside frontend/
    3. Builds the Vite frontend (npm run build) → frontend/dist/
    4. Runs PyInstaller with EAOS.spec → dist/EAOS.exe
    5. Copies .env next to EAOS.exe so credentials are editable

The resulting dist/ folder contains everything needed to run EAOS on any
Windows machine without Python or Node installed.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys


ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT, "frontend")
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")
DIST_DIR = os.path.join(ROOT, "dist")
EXE_PATH = os.path.join(DIST_DIR, "EAOS.exe")
ENV_SRC = os.path.join(ROOT, ".env")
ENV_DST = os.path.join(DIST_DIR, ".env")


def run(cmd: list[str], cwd: str = ROOT) -> None:
    """Run a subprocess command and raise on failure."""
    print(f"\n▶  {' '.join(cmd)}  (cwd={cwd})\n{'─'*60}")
    result = subprocess.run(cmd, cwd=cwd)
    if result.returncode != 0:
        print(f"\n✗ Command failed with exit code {result.returncode}")
        sys.exit(result.returncode)


def main() -> None:
    print("=" * 60)
    print("  EAOS — Build Script")
    print("=" * 60)

    # ── Step 1: Python dependencies ──────────────────────────────────────────
    print("\n[1/4] Installing Python dependencies…")
    run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "--quiet"])
    run([sys.executable, "-m", "pip", "install", "pyinstaller", "--quiet"])

    # ── Step 2 & 3: Frontend ─────────────────────────────────────────────────
    print("\n[2/4] Installing Node dependencies…")
    run(["npm", "install"], cwd=FRONTEND_DIR)

    print("\n[3/4] Building Vite frontend…")
    run(["npm", "run", "build"], cwd=FRONTEND_DIR)

    if not os.path.isdir(FRONTEND_DIST):
        print(f"\n✗ Frontend build did not produce {FRONTEND_DIST}")
        sys.exit(1)

    # ── Step 4: PyInstaller ──────────────────────────────────────────────────
    print("\n[4/4] Packaging with PyInstaller…")
    run(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "EAOS.spec",
            "--noconfirm",
            "--clean",
        ]
    )

    # ── Post-build: copy .env next to exe ────────────────────────────────────
    if os.path.exists(ENV_SRC) and os.path.isfile(ENV_SRC):
        print(f"\n↳  Copying .env → {ENV_DST}")
        shutil.copy2(ENV_SRC, ENV_DST)
    else:
        print(
            "\n⚠  No .env found in project root.\n"
            "   Create dist/.env with your credentials before running EAOS.exe"
        )

    # ── Done ─────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    if os.path.isfile(EXE_PATH):
        size_mb = os.path.getsize(EXE_PATH) / (1024 * 1024)
        print(f"  ✓ Build complete!  ({size_mb:.1f} MB)")
        print(f"  → {EXE_PATH}")
    else:
        print("  ⚠ EXE not found — check PyInstaller output above.")
    print("\n  To run:  double-click dist\\EAOS.exe")
    print("  The app opens at http://127.0.0.1:8000 automatically.")
    print("=" * 60)


if __name__ == "__main__":
    main()
