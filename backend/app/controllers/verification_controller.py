from flask import jsonify
from app.services.blockchain_service import get_evidence_record
from app.services.hash_index_service import (
    get_case_evidence_by_evidence_id,
    get_hash_index_record,
    list_case_evidence,
    list_case_evidence_for_case,
)
from app.services.audit_service import get_audit_summary_for_case, log_audit_event


def list_verification_cases():
    try:
        from flask import request
        limit = int(request.args.get("limit", 200))
        rows = list_case_evidence(limit=max(1, min(limit, 1000)))
        return jsonify({"status": "success", "cases": rows}), 200
    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500


def get_verification_source(case_id: str):
    try:
        case_rows = list_case_evidence_for_case(case_id, limit=500)
        if not case_rows:
            return jsonify({"error": "Case ID not found in ledger."}), 404

        latest = case_rows[0]
        latest_evidence_id = latest["evidence_id"]
        chain_record = get_evidence_record(latest_evidence_id)
        indexed_record = get_hash_index_record(case_id)

        return jsonify(
            {
                "status": "success",
                "case_id": case_id,
                "evidence_id": latest_evidence_id,
                "source_hash": chain_record["file_hash"] if chain_record else latest["hash"],
                "txid": latest.get("tx_hash") or (indexed_record["txid"] if indexed_record else None),
                "block_timestamp": chain_record["timestamp"] if chain_record else None,
                "evidence": case_rows,
            }
        ), 200
    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500


def get_verification_source_by_evidence(evidence_id: str):
    try:
        evidence = get_case_evidence_by_evidence_id(evidence_id)
        if not evidence:
            return jsonify({"error": "Evidence ID not found."}), 404

        case_id = evidence["case_id"]
        chain_record = get_evidence_record(evidence_id)

        return jsonify(
            {
                "status": "success",
                "case_id": case_id,
                "evidence_id": evidence_id,
                "source_hash": chain_record["file_hash"] if chain_record else evidence["hash"],
                "txid": evidence.get("tx_hash"),
                "block_timestamp": chain_record["timestamp"] if chain_record else None,
                "evidence": evidence,
            }
        ), 200
    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

def verify_evidence(request):
    """
    Orchestrates the comparison of request hashes against the immutable ledger layer.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON payload."}), 400

        case_id = data.get('case_id')
        evidence_id = data.get('evidence_id')
        user_hash = data.get('hash')

        if not case_id or not user_hash:
            return jsonify({"error": "Missing fields."}), 400

        case_rows = list_case_evidence_for_case(case_id, limit=500)
        if not case_rows:
            return jsonify({"error": "Case ID not found in ledger."}), 404

        resolved_evidence_id = evidence_id or case_rows[0]["evidence_id"]
        chain_record = get_evidence_record(resolved_evidence_id)
        evidence_row = get_case_evidence_by_evidence_id(resolved_evidence_id)
        if not evidence_row:
            return jsonify({"error": "Evidence not found for case."}), 404

        indexed_record = get_hash_index_record(case_id)
        stored_hash = chain_record["file_hash"] if chain_record else evidence_row["hash"]
        status = "VERIFIED" if user_hash == stored_hash else "TAMPERED"

        log_audit_event(
            action="CASE_VERIFIED" if status == "VERIFIED" else "CASE_TAMPERED",
            actor="SYSTEM",
            case_id=case_id,
            evidence_id=resolved_evidence_id,
            txid=evidence_row.get("tx_hash") or (indexed_record["txid"] if indexed_record else None),
            details={
                "status": status,
                "submitted_hash": user_hash,
                "stored_hash": stored_hash,
                "block_timestamp": chain_record["timestamp"] if chain_record else None,
            },
        )

        return jsonify({
            "status": status,
            "case_id": case_id,
            "evidence_id": resolved_evidence_id,
            "hash": stored_hash,
            "txid": evidence_row.get("tx_hash") or (indexed_record["txid"] if indexed_record else None),
            "block_timestamp": chain_record["timestamp"] if chain_record else None,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500
