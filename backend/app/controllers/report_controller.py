from datetime import datetime, timezone
from flask import jsonify
from app.services.blockchain_service import get_evidence_hash
from app.services.pdf_service import generate_certificate

def generate_report(case_id, request=None):
    """
    Orchestrates data fetching to safely deploy the BSA structural certificate JSON.
    """
    try:
        if not case_id:
             return jsonify({"error": "Invalid case_id."}), 404
             
        stored_hash = get_evidence_hash(case_id)
        if not stored_hash:
            return jsonify({"error": "Case ID not found in ledger."}), 404
            
        # Timestamp explicitly created downstream in the controller layer now
        timestamp = datetime.now(timezone.utc).isoformat()
        
        cert_json = generate_certificate(case_id, stored_hash, timestamp)
        
        return jsonify({
            'status': 'success',
            'case_id': case_id,
            'report': cert_json
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500
