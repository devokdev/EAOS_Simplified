import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/db")
GEMINI_KEY_1 = os.getenv("GEMINI_KEY_1", "")
GEMINI_KEY_2 = os.getenv("GEMINI_KEY_2", "")
GEMINI_KEYS = [k for k in [GEMINI_KEY_1, GEMINI_KEY_2] if k]
GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
