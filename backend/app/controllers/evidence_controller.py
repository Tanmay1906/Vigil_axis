import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from flask import jsonify
from app.services.storage_service import save_file
from app.services.hashing_service import generate_hash
from app.services.blockchain_service import log_evidence
from app.services.hash_index_service import create_case_and_evidence_record, upsert_hash_index, update_case_tx_hash
from app.services.audit_service import log_audit_event

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRIAGE_RUNNER_PATH = os.path.join(os.path.dirname(BASE_DIR), "triage-scripts", "orchestrator", "triage_runner.py")

def upload_evidence(request):
    """
    Orchestrates the secure ingestion, storage, hashing, and blockchain logging
    of uploaded digital evidence files.
    """
    try:
        if 'file' not in request.files or request.files['file'].filename == '':
            return jsonify({"error": "Missing file payload"}), 400
            
        uploaded_file = request.files['file']
        
        # 1. Generate Metadata
        timestamp = datetime.now(timezone.utc).isoformat()
        investigator = request.form.get("investigator", "UNKNOWN_INVESTIGATOR")
        collector = request.form.get("collector", "UNKNOWN_COLLECTOR")
        submitter = request.form.get("submitter", "UNKNOWN_SUBMITTER")
        case_description = request.form.get("case_description", "")
        evidence_description = request.form.get("evidence_description", "")
        
        # 2. Atomic hash pipeline: hash first, rewind, then persist to disk.
        file_hash = generate_hash(uploaded_file)
        file_path = save_file(uploaded_file)
        # Create deterministic ascending CASE_### and Evidence IDs in DB first.
        placeholder_tx_hash = f"PENDING_{time.time_ns()}"
        registry_record = create_case_and_evidence_record(
            case_txn_hash=placeholder_tx_hash,
            file_hash=file_hash,
            investigator=investigator,
            case_description=case_description,
            evidence_collector_name=collector,
            evidence_description=evidence_description,
        )

        case_id = registry_record["case_id"]
        evidence_id = registry_record["evidence_id"]
        log_audit_event(
            action="CASE_CREATED",
            actor=investigator,
            case_id=case_id,
            evidence_id=evidence_id,
            details={
                "case_description": case_description,
                "created_at_ist": registry_record["case_created_at_ist"],
            },
        )
        blockchain_record = log_evidence(case_id, file_hash, timestamp)
        log_audit_event(
            action="BLOCKCHAIN_ANCHORED",
            actor=submitter,
            case_id=case_id,
            evidence_id=evidence_id,
            txid=blockchain_record["txid"],
            details={
                "block_number": blockchain_record["block_number"],
                "block_timestamp": blockchain_record["block_timestamp"],
                "contract_address": blockchain_record["contract_address"],
            },
        )

        upsert_hash_index(
            case_id=case_id,
            file_hash=file_hash,
            txid=blockchain_record["txid"],
            block_number=blockchain_record["block_number"],
            block_timestamp=blockchain_record["block_timestamp"],
            investigator=investigator,
            collector=collector,
            submitter=submitter,
            file_path=file_path,
        )
        update_case_tx_hash(case_id=case_id, txid=blockchain_record["txid"])
        log_audit_event(
            action="EVIDENCE_UPLOADED",
            actor=collector,
            case_id=case_id,
            evidence_id=evidence_id,
            txid=blockchain_record["txid"],
            details={
                "evidence_uploaded_at_ist": registry_record["evidence_uploaded_at_ist"],
                "evidence_description": evidence_description,
                "file_path": file_path,
                "collector": collector,
            },
        )
        
        return jsonify({
            "case_id": case_id,
            "evidence_id": evidence_id,
            "hash": file_hash,
            "txid": blockchain_record["txid"],
            "block_number": blockchain_record["block_number"],
            "block_timestamp": blockchain_record["block_timestamp"],
            "case_created_at_ist": registry_record["case_created_at_ist"],
            "evidence_uploaded_at_ist": registry_record["evidence_uploaded_at_ist"],
            "investigator": investigator,
            "collector": collector,
            "submitter": submitter,
            "case_description": case_description,
            "evidence_description": evidence_description,
            "status": "stored"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

def collect_evidence(request):
    """Triggers real triage collection and returns parsed ingestion output."""
    log_audit_event(
        action="COLLECT_TRIGGERED",
        actor=request.form.get("collector", "SYSTEM"),
        details={"timeout": request.args.get("timeout", "120")},
    )

    if not os.path.exists(TRIAGE_RUNNER_PATH):
        return jsonify({"error": f"Triage runner missing at {TRIAGE_RUNNER_PATH}"}), 500

    timeout_seconds = int(request.args.get("timeout", "120"))

    try:
        proc = subprocess.run(
            [sys.executable, TRIAGE_RUNNER_PATH],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return jsonify({"error": f"Triage collection timed out after {timeout_seconds}s"}), 504

    output_lines = [line.strip() for line in (proc.stdout + "\n" + proc.stderr).splitlines() if line.strip()]
    parsed = {
        "case_id": None,
        "hash": None,
        "txid": None,
        "artifacts": None,
    }

    for line in output_lines:
        if "Secured Case ID:" in line:
            parsed["case_id"] = line.split("Secured Case ID:", 1)[1].strip()
        elif "Blockchain Anchor:" in line:
            parsed["hash"] = line.split("Blockchain Anchor:", 1)[1].strip()
        elif "On-Chain TXID:" in line:
            parsed["txid"] = line.split("On-Chain TXID:", 1)[1].strip()
        elif "Artifact Summary:" in line:
            raw_json = line.split("Artifact Summary:", 1)[1].strip()
            try:
                parsed["artifacts"] = json.loads(raw_json)
            except json.JSONDecodeError:
                parsed["artifacts"] = raw_json

    status_code = 200 if proc.returncode == 0 else 500
    log_audit_event(
        action="COLLECT_COMPLETED" if status_code == 200 else "COLLECT_FAILED",
        actor=request.form.get("collector", "SYSTEM"),
        details={
            "exit_code": proc.returncode,
            "result": parsed,
        },
    )
    return jsonify(
        {
            "status": "success" if proc.returncode == 0 else "failed",
            "exit_code": proc.returncode,
            "result": parsed,
            "logs": output_lines[-60:],
        }
    ), status_code
