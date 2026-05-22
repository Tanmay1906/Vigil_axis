import os
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.services.blockchain_service import get_evidence_record
from app.services.hash_index_service import get_case_evidence_by_evidence_id, get_hash_index_record, list_case_evidence_for_case
from app.utils.logger import get_sys_logger

logger = get_sys_logger(__name__)

REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")


def _ensure_report_dir() -> None:
    os.makedirs(REPORT_DIR, exist_ok=True)


def generate_certificate(
    case_id: str,
    investigator: str = "UNKNOWN_INVESTIGATOR",
    collector: str = "UNKNOWN_COLLECTOR",
    submitter: str = "UNKNOWN_SUBMITTER",
    evidence_id: str | None = None,
) -> dict:
    """Generates BSA 2026 compliance PDF from on-chain evidence and anchored tx metadata."""
    resolved_case_id = case_id
    resolved_evidence_id = evidence_id

    evidence_row = None
    if resolved_evidence_id:
        evidence_row = get_case_evidence_by_evidence_id(resolved_evidence_id)
        if not evidence_row:
          raise ValueError(f"Evidence ID {resolved_evidence_id} not found.")
        resolved_case_id = evidence_row["case_id"]
    elif resolved_case_id:
        case_evidence = list_case_evidence_for_case(resolved_case_id, limit=1)
        if not case_evidence:
            raise ValueError(f"Case ID {resolved_case_id} not found.")
        evidence_row = case_evidence[0]
        resolved_evidence_id = evidence_row["evidence_id"]

    chain_record = get_evidence_record(resolved_evidence_id) if resolved_evidence_id else None

    hash_index_record = get_hash_index_record(resolved_case_id)
    txid = hash_index_record["txid"] if hash_index_record else (evidence_row.get("tx_hash") if evidence_row else "UNAVAILABLE")
    block_timestamp = (
        hash_index_record["block_timestamp"]
        if hash_index_record
        else (chain_record["timestamp"] if chain_record else None)
    )
    identity_investigator = hash_index_record["investigator"] if hash_index_record else (evidence_row.get("investigator") if evidence_row else investigator)
    identity_collector = hash_index_record["collector"] if hash_index_record else (evidence_row.get("collector") if evidence_row else collector)
    identity_submitter = hash_index_record["submitter"] if hash_index_record else submitter
    evidence_hash = (
        chain_record["file_hash"] if chain_record
        else (evidence_row.get("hash") if evidence_row else "UNAVAILABLE")
    )

    _ensure_report_dir()
    generated_at = datetime.now(timezone.utc)
    suffix = resolved_evidence_id if resolved_evidence_id else resolved_case_id
    output_path = os.path.join(REPORT_DIR, f"certificate_{suffix}.pdf")

    pdf = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, height - 50, "BSA CHAIN OF CUSTODY CERTIFICATE - SECTION 63(4) BSA 2026")

    pdf.setFont("Helvetica", 11)
    y = height - 90
    lines = [
        f"Case ID: {resolved_case_id}",
        f"Evidence ID: {resolved_evidence_id or 'N/A'}",
        f"On-Chain TXID: {txid}",
        f"SHA-256 Artifact DNA: {evidence_hash}",
        f"Block Timestamp (Unix): {block_timestamp if block_timestamp is not None else 'UNAVAILABLE'}",
        f"Investigator: {identity_investigator}",
        f"Collector: {identity_collector}",
        f"Submitter: {identity_submitter}",
        f"Certificate Generated At (UTC): {generated_at.isoformat()}",
    ]

    for line in lines:
        pdf.drawString(40, y, line)
        y -= 24

    pdf.setFont("Helvetica-Oblique", 9)
    pdf.drawString(40, 70, "VIGIL-AXIS Forensic OS - Immutable Evidence Attestation")
    pdf.save()

    logger.info("Compliance certificate generated for case_id=%s at %s", case_id, output_path)
    return {
        "case_id": resolved_case_id,
        "evidence_id": resolved_evidence_id,
        "txid": txid,
        "hash": evidence_hash,
        "block_timestamp": block_timestamp,
        "investigator": identity_investigator,
        "collector": identity_collector,
        "submitter": identity_submitter,
        "pdf_path": output_path,
        "certificate_status": "generated",
        "generated_at": generated_at.isoformat(),
    }


def generate_pdf_report(case_id: str, _file_hash: str | None = None) -> dict:
    """Backward-compatible wrapper for older callers."""
    return generate_certificate(case_id=case_id)
