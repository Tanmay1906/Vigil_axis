import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import psycopg
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

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
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_trail (
                audit_id BIGSERIAL PRIMARY KEY,
                case_id TEXT,
                evidence_id TEXT,
                txid TEXT,
                action TEXT NOT NULL,
                actor TEXT NOT NULL,
                details JSONB NOT NULL DEFAULT '{}'::jsonb,
                occurred_at_ist TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_trail_case_id ON audit_trail (case_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_trail_evidence_id ON audit_trail (evidence_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail (action);")


def _to_ist_iso(value) -> Optional[str]:
    if value is None:
        return None
    if getattr(value, "tzinfo", None) is None:
        value = value.replace(tzinfo=IST)
    return value.astimezone(IST).isoformat()


def log_audit_event(
    *,
    action: str,
    actor: str,
    case_id: Optional[str] = None,
    evidence_id: Optional[str] = None,
    txid: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    db_url = _database_url()
    occurred_at_ist = datetime.now(IST)
    payload = details or {}

    try:
        with psycopg.connect(db_url) as conn:
            _ensure_schema(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO audit_trail (
                        case_id,
                        evidence_id,
                        txid,
                        action,
                        actor,
                        details,
                        occurred_at_ist
                    )
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s);
                    """,
                    (
                        case_id,
                        evidence_id,
                        txid,
                        action,
                        actor,
                        json.dumps(payload),
                        occurred_at_ist,
                    ),
                )
            conn.commit()
        logger.info("Audit event logged: %s (%s)", action, case_id or evidence_id or actor)
    except Exception as exc:
        logger.error("Audit logging failed: %s", exc)


def get_latest_case_id() -> Optional[str]:
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute("SELECT case_id FROM case_table ORDER BY created_at_ist DESC LIMIT 1;")
            row = cur.fetchone()
            return row[0] if row else None


def get_case_audit_summary(case_id: str) -> Dict[str, Any]:
    db_url = _database_url()
    with psycopg.connect(db_url) as conn:
        _ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT case_id, case_txn_hash, created_at_ist, investigator, description
                FROM case_table
                WHERE case_id = %s;
                """,
                (case_id,),
            )
            case_row = cur.fetchone()
            if not case_row:
                raise ValueError(f"Case ID {case_id} not found.")

            cur.execute(
                """
                SELECT evidence_id, evidence_hash, uploaded_at_ist, evidence_collector_name, description
                FROM evidence_table
                WHERE case_id = %s
                ORDER BY evidence_id ASC;
                """,
                (case_id,),
            )
            evidence_rows = cur.fetchall()

            cur.execute(
                """
                SELECT audit_id, action, actor, txid, evidence_id, details, occurred_at_ist
                FROM audit_trail
                WHERE case_id = %s
                ORDER BY occurred_at_ist ASC, audit_id ASC;
                """,
                (case_id,),
            )
            audit_rows = cur.fetchall()

    return {
        "case": {
            "case_id": case_row[0],
            "case_txn_hash": case_row[1],
            "created_at_ist": _to_ist_iso(case_row[2]),
            "investigator": case_row[3],
            "description": case_row[4],
        },
        "evidence": [
            {
                "evidence_id": row[0],
                "hash": row[1],
                "uploaded_at_ist": _to_ist_iso(row[2]),
                "evidence_collector_name": row[3],
                "description": row[4],
            }
            for row in evidence_rows
        ],
        "audit_trail": [
            {
                "audit_id": row[0],
                "action": row[1],
                "actor": row[2],
                "txid": row[3],
                "evidence_id": row[4],
                "details": row[5],
                "occurred_at_ist": _to_ist_iso(row[6]),
            }
            for row in audit_rows
        ],
    }


def get_audit_summary_for_case(case_id: Optional[str] = None) -> Dict[str, Any]:
    resolved_case_id = case_id or get_latest_case_id()
    if not resolved_case_id:
        raise ValueError("No case found for audit summary.")
    return get_case_audit_summary(resolved_case_id)


def generate_audit_trail_pdf(case_id: Optional[str] = None, output_dir: Optional[str] = None) -> Dict[str, Any]:
    resolved_case_id = case_id or get_latest_case_id()
    if not resolved_case_id:
        raise ValueError("No case available for audit report generation.")

    summary = get_case_audit_summary(resolved_case_id)
    report_dir = Path(output_dir or os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports"))
    report_dir.mkdir(parents=True, exist_ok=True)
    output_path = report_dir / f"audit_trail_{resolved_case_id}.pdf"

    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    width, height = A4
    y = height - 50

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, f"AUDIT TRAIL REPORT - {resolved_case_id}")
    y -= 28

    pdf.setFont("Helvetica", 10)
    case_info = summary["case"]
    for line in [
        f"Case ID: {case_info['case_id']}",
        f"Case TXN Hash: {case_info['case_txn_hash']}",
        f"Created (IST): {case_info['created_at_ist']}",
        f"Investigator: {case_info['investigator']}",
        f"Description: {case_info['description'] or ''}",
    ]:
        pdf.drawString(40, y, line)
        y -= 18

    y -= 8
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(40, y, "Evidence Summary")
    y -= 20
    pdf.setFont("Helvetica", 9)
    if summary["evidence"]:
        for item in summary["evidence"]:
            pdf.drawString(40, y, f"{item['evidence_id']} | {item['hash']} | {item['uploaded_at_ist']} | {item['evidence_collector_name']}")
            y -= 16
            if y < 80:
                pdf.showPage()
                y = height - 50
                pdf.setFont("Helvetica", 9)
    else:
        pdf.drawString(40, y, "No evidence records found.")
        y -= 16

    y -= 8
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(40, y, "Audit Timeline")
    y -= 20
    pdf.setFont("Helvetica", 9)
    for item in summary["audit_trail"]:
        details_text = json.dumps(item["details"], ensure_ascii=False)
        pdf.drawString(40, y, f"{item['occurred_at_ist']} | {item['action']} | {item['actor']} | {item['evidence_id'] or '-'}")
        y -= 14
        pdf.drawString(50, y, details_text[:150])
        y -= 18
        if y < 80:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 9)

    pdf.save()

    return {
        "case_id": resolved_case_id,
        "pdf_path": str(output_path),
        "summary": summary,
    }
