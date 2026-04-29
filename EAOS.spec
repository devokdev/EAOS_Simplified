# -*- mode: python ; coding: utf-8 -*-
"""
EAOS.spec  —  PyInstaller build specification for EAOS.exe

Build with:
    pyinstaller EAOS.spec --noconfirm

Or just run:
    python build_exe.py
"""

import os

ROOT = os.path.dirname(os.path.abspath(SPEC))  # noqa: F821  (SPEC injected by PyInstaller)

block_cipher = None

a = Analysis(
    [os.path.join(ROOT, "run.py")],
    pathex=[ROOT],
    binaries=[],
    datas=[
        # Bundle the pre-built Vite frontend into frontend/dist/ inside the exe directory.
        # NOTE: build_exe.py runs `npm run build` before PyInstaller, so this directory
        # must exist before running pyinstaller.
        (os.path.join(ROOT, "frontend", "dist"), os.path.join("frontend", "dist")),
    ],
    hiddenimports=[
        # FastAPI / Starlette internals
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.loops.asyncio",
        "uvicorn.loops.uvloop",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.http.h11_impl",
        "uvicorn.protocols.http.httptools_impl",
        "uvicorn.protocols.websockets",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.protocols.websockets.websockets_impl",
        "uvicorn.protocols.websockets.wsproto_impl",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "uvicorn.lifespan.off",
        "starlette.routing",
        "starlette.middleware",
        "starlette.staticfiles",
        "starlette.responses",
        "starlette.background",
        "anyio",
        "anyio._backends._asyncio",
        # asyncpg
        "asyncpg",
        "asyncpg.pgproto.pgproto",
        # google-generativeai
        "google.generativeai",
        # dotenv
        "dotenv",
        # backend package
        "backend",
        "backend.main",
        "backend.config",
        "backend.database",
        "backend.models",
        "backend.routes",
        "backend.routes.automation",
        "backend.routes.campaigns",
        "backend.routes.contacts",
        "backend.routes.dashboard",
        "backend.routes.dashboard_v2",
        "backend.routes.datasets",
        "backend.routes.emails",
        "backend.routes.logbook",
        "backend.routes.settings",
        "backend.routes.templates",
        "backend.services",
        "backend.services.gemini_service",
        "backend.services.gmail_service",
        "backend.services.templates_service",
        # email stdlib extras sometimes missed
        "email.mime.text",
        "email.mime.multipart",
        "email.mime.base",
        "multiprocessing",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)  # noqa: F821

exe = EXE(  # noqa: F821
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="EAOS",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,           # keep console so users can see startup logs / errors
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,              # set to an .ico path if you have one
)
