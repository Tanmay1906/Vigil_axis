import os
import time
import threading
from datetime import datetime
from typing import Any, Dict, Optional
from zoneinfo import ZoneInfo

import psycopg

from app.utils.logger import get_sys_logger

logger = get_sys_logger(__name__)
IST = ZoneInfo("Asia/Kolkata")
_schema_ready = False
_schema_lock = threading.Lock()


def _database_url() -> str:
    db_url = os.environ.get("HASH_INDEX_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("HASH_INDEX_DATABASE_URL or DATABASE_URL must be configured.")
    return db_url


def _ensure_schema(conn: psycopg.Connection) -> None:
    global _schema_ready
    if _schema_ready:
        return

    with _schema_lock:
        if _schema_ready:
            return

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

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ledger_entries (
                id BIGSERIAL PRIMARY KEY,
                case_id TEXT NOT NULL,
                evidence_id TEXT,
                tx_hash TEXT NOT NULL UNIQUE,
                block_number BIGINT NOT NULL,
                block_timestamp BIGINT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ledger_entries_case_id ON ledger_entries(case_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ledger_entries_block_number ON ledger_entries(block_number DESC);")

        # Ensure sequence starts from the highest existing case number + 1.
        cur.execute("SELECT MAX(CAST(substring(case_id FROM '([0-9]+)$') AS INTEGER)) FROM case_table;")
        result = cur.fetchone()
        max_case_num = int(result[0]) if result and result[0] is not None else 0
        next_seq_val = max_case_num + 1
        cur.execute("SELECT setval('case_id_seq', %s, false);", (next_seq_val,))

    _schema_ready = True


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


def create_case_record_only(*, investigator: str, case_description: str) -> Dict[str, Any]:
    """Creates a new case record without evidence; used when investigator pre-registers case."""
    db_url = _database_url()
    created_at_ist = datetime.now(IST)
    placeholder_tx_hash = f"PENDING_CASE_{time.time_ns()}"

    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            case_id = _next_case_id(cur)
            cur.execute(
                """
                INSERT INTO case_table (case_id, case_txn_hash, created_at_ist, investigator, description)
                VALUES (%s, %s, %s, %s, %s);
                """,
                (case_id, placeholder_tx_hash, created_at_ist, investigator, case_description),
            )
        conn.commit()

    return {
        "case_id": case_id,
        "case_txn_hash": placeholder_tx_hash,
        "created_at_ist": created_at_ist.isoformat(),
        "investigator": investigator,
        "description": case_description,
        "status": "created",
    }


def list_cases(limit: int = 200) -> list[Dict[str, Any]]:
    """Returns cases from case_table, including those without evidence records."""
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT case_id, case_txn_hash, created_at_ist, investigator, description
                FROM case_table
                ORDER BY created_at_ist DESC
                LIMIT %s;
                """,
                (max(1, limit),),
            )
            rows = cur.fetchall()

    return [
        {
            "case_id": row[0],
            "case_txn_hash": row[1],
            "created_at_ist": row[2].isoformat() if row[2] else None,
            "investigator": row[3],
            "description": row[4],
        }
        for row in rows
    ]


def find_existing_evidence_by_hash(file_hash: str, *, case_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Returns existing evidence record for the given hash, optionally scoped to a case."""
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            if case_id:
                cur.execute(
                    """
                    SELECT evidence_id, case_id, uploaded_at_ist
                    FROM evidence_table
                    WHERE evidence_hash = %s AND case_id = %s
                    ORDER BY uploaded_at_ist DESC
                    LIMIT 1;
                    """,
                    (file_hash, case_id),
                )
            else:
                cur.execute(
                    """
                    SELECT evidence_id, case_id, uploaded_at_ist
                    FROM evidence_table
                    WHERE evidence_hash = %s
                    ORDER BY uploaded_at_ist DESC
                    LIMIT 1;
                    """,
                    (file_hash,),
                )
            row = cur.fetchone()

    if not row:
        return None

    return {
        "evidence_id": row[0],
        "case_id": row[1],
        "uploaded_at_ist": row[2].isoformat() if row[2] else None,
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


def create_evidence_for_case(
    *,
    case_id: str,
    file_hash: str,
    evidence_collector_name: str,
    evidence_description: str,
) -> Dict[str, Any]:
    """Appends a new evidence entry to an existing case and returns generated evidence_id."""
    db_url = _database_url()
    uploaded_at_ist = datetime.now(IST)
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
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
                    uploaded_at_ist,
                    evidence_collector_name,
                    evidence_description,
                ),
            )
        conn.commit()

    return {
        "case_id": case_id,
        "evidence_id": evidence_id,
        "evidence_uploaded_at_ist": uploaded_at_ist.isoformat(),
    }


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


def insert_ledger_entry(*, case_id: str, evidence_id: Optional[str], tx_hash: str, block_number: int, block_timestamp: int) -> None:
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ledger_entries (case_id, evidence_id, tx_hash, block_number, block_timestamp)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (tx_hash) DO NOTHING;
                """,
                (case_id, evidence_id, tx_hash, block_number, block_timestamp),
            )
        conn.commit()


def list_ledger_entries(limit: int = 100) -> list[Dict[str, Any]]:
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT case_id, evidence_id, tx_hash, block_number, block_timestamp
                FROM ledger_entries
                ORDER BY block_number DESC
                LIMIT %s;
                """,
                (max(1, limit),),
            )
            rows = cur.fetchall()

    return [
        {
            "case_id": row[0],
            "evidence_id": row[1],
            "tx_hash": row[2],
            "block_number": int(row[3]),
            "block_timestamp": int(row[4]),
        }
        for row in rows
    ]


def get_dashboard_stats() -> Dict[str, Any]:
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM case_table;")
            total_cases = int(cur.fetchone()[0])

            cur.execute("SELECT COUNT(*) FROM evidence_table;")
            total_evidence = int(cur.fetchone()[0])

            cur.execute("SELECT COUNT(*) FROM case_table WHERE case_txn_hash LIKE 'PENDING_%';")
            pending_cases = int(cur.fetchone()[0])

            completed_cases = max(0, total_cases - pending_cases)

            cur.execute("SELECT COUNT(*) FROM audit_trail WHERE action = 'CASE_TAMPERED';")
            tampered_events = int(cur.fetchone()[0])

    if total_evidence == 0:
        integrity_score = 100
    else:
        degraded = min(total_evidence, tampered_events)
        integrity_score = int(round(((total_evidence - degraded) / total_evidence) * 100))

    return {
        "pending": pending_cases,
        "completed": completed_cases,
        "integrity_score": max(0, min(100, integrity_score)),
        "total_cases": total_cases,
        "total_evidence": total_evidence,
    }


def list_case_evidence(limit: int = 100) -> list[Dict[str, Any]]:
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    e.case_id,
                    e.evidence_id,
                    e.evidence_hash,
                    e.uploaded_at_ist,
                    le.tx_hash,
                    c.investigator,
                    e.evidence_collector_name,
                    c.description,
                    e.description
                FROM evidence_table e
                JOIN case_table c ON c.case_id = e.case_id
                LEFT JOIN ledger_entries le ON le.evidence_id = e.evidence_id
                ORDER BY e.uploaded_at_ist DESC
                LIMIT %s;
                """,
                (max(1, limit),),
            )
            rows = cur.fetchall()

    return [
        {
            "case_id": row[0],
            "evidence_id": row[1],
            "hash": row[2],
            "uploaded_at_ist": row[3].astimezone(IST).isoformat() if row[3] else None,
            "tx_hash": row[4],
            "investigator": row[5],
            "collector": row[6],
            "case_description": row[7],
            "evidence_description": row[8],
        }
        for row in rows
    ]


def list_case_evidence_for_case(case_id: str, limit: int = 500) -> list[Dict[str, Any]]:
    """Returns evidence rows for a specific case ordered by latest upload time."""
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    e.case_id,
                    e.evidence_id,
                    e.evidence_hash,
                    e.uploaded_at_ist,
                    le.tx_hash,
                    c.investigator,
                    e.evidence_collector_name,
                    c.description,
                    e.description
                FROM evidence_table e
                JOIN case_table c ON c.case_id = e.case_id
                LEFT JOIN ledger_entries le ON le.evidence_id = e.evidence_id
                WHERE e.case_id = %s
                ORDER BY e.uploaded_at_ist DESC
                LIMIT %s;
                """,
                (case_id, max(1, limit)),
            )
            rows = cur.fetchall()

    return [
        {
            "case_id": row[0],
            "evidence_id": row[1],
            "hash": row[2],
            "uploaded_at_ist": row[3].astimezone(IST).isoformat() if row[3] else None,
            "tx_hash": row[4],
            "investigator": row[5],
            "collector": row[6],
            "case_description": row[7],
            "evidence_description": row[8],
        }
        for row in rows
    ]


def get_case_evidence_by_evidence_id(evidence_id: str) -> Optional[Dict[str, Any]]:
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    e.case_id,
                    e.evidence_id,
                    e.evidence_hash,
                    e.uploaded_at_ist,
                    le.tx_hash,
                    c.investigator,
                    e.evidence_collector_name,
                    c.description,
                    e.description
                FROM evidence_table e
                JOIN case_table c ON c.case_id = e.case_id
                LEFT JOIN ledger_entries le ON le.evidence_id = e.evidence_id
                WHERE e.evidence_id = %s;
                """,
                (evidence_id,),
            )
            row = cur.fetchone()

    if not row:
        return None

    return {
        "case_id": row[0],
        "evidence_id": row[1],
        "hash": row[2],
        "uploaded_at_ist": row[3].astimezone(IST).isoformat() if row[3] else None,
        "tx_hash": row[4],
        "investigator": row[5],
        "collector": row[6],
        "case_description": row[7],
        "evidence_description": row[8],
    }
