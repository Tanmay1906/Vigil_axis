import os
import shutil
import sqlite3
import tempfile
from datetime import datetime, timedelta, timezone

from utils.file_handler import save_json
from utils.logger import log_info


def _resolve_history_db(profile_dir: str | None = None) -> str:
    base_profile_dir = profile_dir or os.environ.get(
        "CHROME_PROFILE_DIR",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Google", "Chrome", "User Data", "Default"),
    )
    db_path = os.path.join(base_profile_dir, "History")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Chrome History DB not found at {db_path}")
    return db_path


def _webkit_ts_to_iso(value: int) -> str:
    epoch = datetime(1601, 1, 1, tzinfo=timezone.utc)
    return (epoch + timedelta(microseconds=value)).isoformat()


def extract_chrome_history(output_path):
    """Extracts recent Chrome URL visit history from local SQLite profile database."""
    log_info("Extracting Chrome browsing history from local profile database...")

    history_db = _resolve_history_db()
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        temp_db_path = tmp_file.name

    try:
        shutil.copy2(history_db, temp_db_path)
        conn = sqlite3.connect(temp_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                urls.url,
                urls.title,
                urls.visit_count,
                urls.last_visit_time
            FROM urls
            ORDER BY urls.last_visit_time DESC
            LIMIT 500;
            """
        )

        records = []
        for row in cursor.fetchall():
            last_visit_raw = int(row["last_visit_time"] or 0)
            records.append(
                {
                    "url": row["url"],
                    "title": row["title"],
                    "visit_count": int(row["visit_count"] or 0),
                    "timestamp": _webkit_ts_to_iso(last_visit_raw) if last_visit_raw else None,
                    "artifact_type": "chrome_history",
                }
            )

        conn.close()
        return save_json(output_path, records)
    finally:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
