from flask import jsonify
from app.services.blockchain_service import get_evidence_record
from app.services.hash_index_service import get_hash_index_record
from app.services.audit_service import get_audit_summary_for_case, log_audit_event

def verify_evidence(request):
    """
    Orchestrates the comparison of request hashes against the immutable ledger layer.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON payload."}), 400
            
        case_id = data.get('case_id')
        user_hash = data.get('hash')
        
        if not case_id or not user_hash:
            return jsonify({"error": "Missing fields."}), 400
            
        chain_record = get_evidence_record(case_id)
        if not chain_record:
            return jsonify({"error": "Case ID not found in ledger."}), 404

        indexed_record = get_hash_index_record(case_id)
        stored_hash = chain_record["file_hash"]
        status = "VERIFIED" if user_hash == stored_hash else "TAMPERED"

        summary = get_audit_summary_for_case(case_id)
        evidence_id = summary["evidence"][0]["evidence_id"] if summary["evidence"] else None

        log_audit_event(
            action="CASE_VERIFIED" if status == "VERIFIED" else "CASE_TAMPERED",
            actor="SYSTEM",
            case_id=case_id,
            evidence_id=evidence_id,
            txid=indexed_record["txid"] if indexed_record else None,
            details={
                "status": status,
                "submitted_hash": user_hash,
                "stored_hash": stored_hash,
                "block_timestamp": chain_record["timestamp"],
            },
        )
        
        return jsonify({
            "status": status,
            "case_id": case_id,
            "hash": stored_hash,
            "txid": indexed_record["txid"] if indexed_record else None,
            "block_timestamp": chain_record["timestamp"],
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500
