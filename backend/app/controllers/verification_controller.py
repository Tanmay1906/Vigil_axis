from flask import jsonify
from app.services.blockchain_service import get_evidence_hash

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
            
        stored_hash = get_evidence_hash(case_id)
        if not stored_hash:
            return jsonify({"error": "Case ID not found in ledger."}), 404
            
        status = "VERIFIED" if user_hash == stored_hash else "TAMPERED"
        
        return jsonify({
            "status": status
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500
