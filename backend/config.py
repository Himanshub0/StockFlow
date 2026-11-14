import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "stockflow-dev-secret-key-super-secure-2026")
    DATABASE_PATH = os.environ.get("DATABASE_PATH", str(INSTANCE_DIR / "stockflow.db"))
    DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")
    TESTING = False
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://127.0.0.1:5000,http://localhost:5000")

class TestConfig(Config):
    TESTING = True
    DEBUG = True
    DATABASE_PATH = ":memory:"
