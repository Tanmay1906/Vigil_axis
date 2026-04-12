import os
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.services.blockchain_service import get_evidence_record
from app.services.hash_index_service import get_hash_index_record
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
) -> dict:
    """Generates BSA 2026 compliance PDF from on-chain evidence and anchored tx metadata."""
    chain_record = get_evidence_record(case_id)
    if not chain_record:
        raise ValueError(f"Case ID {case_id} not found in blockchain ledger.")

    hash_index_record = get_hash_index_record(case_id)
    txid = hash_index_record["txid"] if hash_index_record else "UNAVAILABLE"
    block_timestamp = (
        hash_index_record["block_timestamp"]
        if hash_index_record
        else chain_record["timestamp"]
    )
    identity_investigator = hash_index_record["investigator"] if hash_index_record else investigator
    identity_collector = hash_index_record["collector"] if hash_index_record else collector
    identity_submitter = hash_index_record["submitter"] if hash_index_record else submitter

    _ensure_report_dir()
    generated_at = datetime.now(timezone.utc)
    output_path = os.path.join(REPORT_DIR, f"certificate_{case_id}.pdf")

    pdf = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, height - 50, "CERTIFICATE UNDER SECTION 63(4) OF BSA 2026")

    pdf.setFont("Helvetica", 11)
    y = height - 90
    lines = [
        f"Case ID: {case_id}",
        f"On-Chain TXID: {txid}",
        f"SHA-256 Artifact DNA: {chain_record['file_hash']}",
        f"Block Timestamp (Unix): {block_timestamp}",
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
        "case_id": case_id,
        "txid": txid,
        "hash": chain_record["file_hash"],
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
