import os
import shutil
import sqlite3
import tempfile
from datetime import datetime, timezone

from utils.file_handler import save_json
from utils.logger import log_info


def _resolve_predictor_db(profile_dir: str | None = None) -> str:
    base_profile_dir = profile_dir or os.environ.get(
        "CHROME_PROFILE_DIR",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Google", "Chrome", "User Data", "Default"),
    )
    db_path = os.path.join(base_profile_dir, "Network Action Predictor")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Network Action Predictor DB not found at {db_path}")
    return db_path


def _table_exists(cursor: sqlite3.Cursor, table_name: str) -> bool:
    cursor.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    return cursor.fetchone() is not None


def extract_chrome_predictor_intent(output_path: str, limit: int = 500) -> str:
    """Extracts predictor URLs that indicate likely user navigation intent."""
    predictor_db = _resolve_predictor_db()
    log_info("Extracting intent evidence from Chrome Network Action Predictor database...")

    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        temp_db_path = tmp_file.name

    try:
        shutil.copy2(predictor_db, temp_db_path)
        conn = sqlite3.connect(temp_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        records: list[dict] = []
        if _table_exists(cursor, "resource_prefetch_predictor_url"):
            cursor.execute(
                f"""
                SELECT
                    key,
                    url,
                    number_of_hits,
                    number_of_misses,
                    consecutive_misses
                FROM resource_prefetch_predictor_url
                ORDER BY number_of_hits DESC
                LIMIT {int(limit)};
                """
            )
            for row in cursor.fetchall():
                records.append(
                    {
                        "artifact_type": "chrome_network_predictor",
                        "intent_key": row["key"],
                        "predicted_url": row["url"],
                        "hits": int(row["number_of_hits"] or 0),
                        "misses": int(row["number_of_misses"] or 0),
                        "consecutive_misses": int(row["consecutive_misses"] or 0),
                        "captured_at": datetime.now(timezone.utc).isoformat(),
                    }
                )

        conn.close()
        return save_json(output_path, records)
    finally:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
