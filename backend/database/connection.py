import sqlite3
import os
from pathlib import Path
from backend.config import Config

SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"

def get_db(db_path=None):
    """
    Returns an ultra-high performance SQLite connection configured with:
    - WAL (Write-Ahead Logging) for concurrent reads/writes
    - SYNCHRONOUS = NORMAL (safe with WAL, 10x faster write throughput)
    - CACHE_SIZE = -64000 (64MB RAM page cache)
    - MMAP_SIZE = 268435456 (256MB memory-mapped I/O for instantaneous reads)
    - TEMP_STORE = MEMORY (temp tables and indices kept in memory)
    - BUSY_TIMEOUT = 5000 (prevents lock contention)
    - Row factory for dictionary-like column access
    """
    target_path = db_path if db_path is not None else Config.DATABASE_PATH

    if target_path != ":memory:":
        os.makedirs(os.path.dirname(target_path), exist_ok=True)

    conn = sqlite3.connect(target_path, timeout=5.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")

    if target_path != ":memory:":
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA cache_size = -64000;")
        conn.execute("PRAGMA mmap_size = 268435456;")
        conn.execute("PRAGMA temp_store = MEMORY;")
        conn.execute("PRAGMA busy_timeout = 5000;")

    return conn

def init_db(db_path=None):
    """Executes schema.sql against the target database with foreign key support."""
    conn = get_db(db_path)
    target_path = db_path if db_path is not None else Config.DATABASE_PATH
    if target_path != ":memory:":
        conn.execute("PRAGMA journal_mode = WAL;")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()

def row_to_dict(row):
    """Converts a sqlite3.Row or tuple into a standard Python dict."""
    if row is None:
        return None
    return {k: row[k] for k in row.keys()}

def rows_to_dict_list(rows):
    """Converts a list of sqlite3.Row objects into a list of dicts."""
    return [row_to_dict(r) for r in rows]
