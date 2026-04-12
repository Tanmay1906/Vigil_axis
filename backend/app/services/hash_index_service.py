import os
from datetime import datetime
from typing import Any, Dict, Optional
from zoneinfo import ZoneInfo

import psycopg

from app.utils.logger import get_sys_logger

logger = get_sys_logger(__name__)
IST = ZoneInfo("Asia/Kolkata")


def _database_url() -> str:
    db_url = os.environ.get("HASH_INDEX_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("HASH_INDEX_DATABASE_URL or DATABASE_URL must be configured.")
    return db_url


def _ensure_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("CREATE SEQUENCE IF NOT EXISTS case_id_seq START 1;")

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS case_table (
                case_id TEXT PRIMARY KEY,
                case_txn_hash TEXT NOT NULL UNIQUE,
                created_at_ist TIMESTAMPTZ NOT NULL,
                investigator TEXT NOT NULL,
                description TEXT
            );
            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS evidence_table (
                evidence_id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL REFERENCES case_table(case_id) ON DELETE CASCADE,
                evidence_hash CHAR(64) NOT NULL,
                uploaded_at_ist TIMESTAMPTZ NOT NULL,
                evidence_collector_name TEXT NOT NULL,
                description TEXT
            );
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence_table(case_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence_table(evidence_hash);")

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS evidence_hash_index (
                case_id TEXT PRIMARY KEY,
                file_hash CHAR(64) NOT NULL,
                txid TEXT NOT NULL,
                block_number BIGINT NOT NULL,
                block_timestamp BIGINT NOT NULL,
                investigator TEXT NOT NULL,
                collector TEXT NOT NULL,
                submitter TEXT NOT NULL,
                file_path TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_evidence_hash_index_file_hash ON evidence_hash_index (file_hash);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_evidence_hash_index_txid ON evidence_hash_index (txid);")


def _next_case_id(cur: psycopg.Cursor) -> str:
    cur.execute("SELECT nextval('case_id_seq');")
    number = int(cur.fetchone()[0])
    return f"CASE_{number:03d}"


def _next_evidence_id(cur: psycopg.Cursor, case_id: str) -> str:
    cur.execute("SELECT case_id FROM case_table WHERE case_id = %s FOR UPDATE;", (case_id,))
    if not cur.fetchone():
        raise ValueError(f"Case {case_id} does not exist.")

    cur.execute(
        """
        SELECT COALESCE(MAX(CAST(substring(evidence_id FROM '([0-9]+)$') AS INTEGER)), 0) + 1
        FROM evidence_table
        WHERE case_id = %s;
        """,
        (case_id,),
    )
    evidence_number = int(cur.fetchone()[0])
    return f"{case_id}_{evidence_number:03d}"


def create_case_and_evidence_record(
    *,
    case_txn_hash: str,
    file_hash: str,
    investigator: str,
    case_description: str,
    evidence_collector_name: str,
    evidence_description: str,
) -> Dict[str, Any]:
    """Creates a new CASE_### and first evidence record CASE_###_001 with IST timestamps."""
    db_url = _database_url()
    created_at_ist = datetime.now(IST)
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            case_id = _next_case_id(cur)
            cur.execute(
                """
                INSERT INTO case_table (case_id, case_txn_hash, created_at_ist, investigator, description)
                VALUES (%s, %s, %s, %s, %s);
                """,
                (case_id, case_txn_hash, created_at_ist, investigator, case_description),
            )

            evidence_id = _next_evidence_id(cur, case_id)
            cur.execute(
                """
                INSERT INTO evidence_table (
                    evidence_id,
                    case_id,
                    evidence_hash,
                    uploaded_at_ist,
                    evidence_collector_name,
                    description
                )
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                (
                    evidence_id,
                    case_id,
                    file_hash,
                    created_at_ist,
                    evidence_collector_name,
                    evidence_description,
                ),
            )
        conn.commit()

    return {
        "case_id": case_id,
        "evidence_id": evidence_id,
        "case_created_at_ist": created_at_ist.isoformat(),
        "evidence_uploaded_at_ist": created_at_ist.isoformat(),
    }


def update_case_tx_hash(case_id: str, txid: str) -> None:
    """Updates case txn hash after successful on-chain anchoring."""
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE case_table SET case_txn_hash = %s WHERE case_id = %s;",
                (txid, case_id),
            )
        conn.commit()


def upsert_hash_index(
    *,
    case_id: str,
    file_hash: str,
    txid: str,
    block_number: int,
    block_timestamp: int,
    investigator: str,
    collector: str,
    submitter: str,
    file_path: Optional[str],
) -> None:
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO evidence_hash_index (
                    case_id,
                    file_hash,
                    txid,
                    block_number,
                    block_timestamp,
                    investigator,
                    collector,
                    submitter,
                    file_path
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (case_id)
                DO UPDATE SET
                    file_hash = EXCLUDED.file_hash,
                    txid = EXCLUDED.txid,
                    block_number = EXCLUDED.block_number,
                    block_timestamp = EXCLUDED.block_timestamp,
                    investigator = EXCLUDED.investigator,
                    collector = EXCLUDED.collector,
                    submitter = EXCLUDED.submitter,
                    file_path = EXCLUDED.file_path,
                    updated_at = NOW();
                """,
                (
                    case_id,
                    file_hash,
                    txid,
                    block_number,
                    block_timestamp,
                    investigator,
                    collector,
                    submitter,
                    file_path,
                ),
            )
        conn.commit()
    logger.info("Hash index updated for case_id=%s", case_id)


def get_hash_index_record(case_id: str) -> Optional[Dict[str, Any]]:
    db_url = os.environ.get("HASH_INDEX_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if not db_url:
        logger.warning("Hash index lookup skipped: DATABASE_URL/HASH_INDEX_DATABASE_URL not configured.")
        return None
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    case_id,
                    file_hash,
                    txid,
                    block_number,
                    block_timestamp,
                    investigator,
                    collector,
                    submitter,
                    file_path,
                    created_at,
                    updated_at
                FROM evidence_hash_index
                WHERE case_id = %s;
                """,
                (case_id,),
            )
            row = cur.fetchone()

    if not row:
        return None

    return {
        "case_id": row[0],
        "file_hash": row[1],
        "txid": row[2],
        "block_number": row[3],
        "block_timestamp": row[4],
        "investigator": row[5],
        "collector": row[6],
        "submitter": row[7],
        "file_path": row[8],
        "created_at": row[9].isoformat() if row[9] else None,
        "updated_at": row[10].isoformat() if row[10] else None,
    }
