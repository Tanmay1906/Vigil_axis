import uuid
from datetime import datetime, timezone
from flask import jsonify
from app.services.storage_service import save_file
from app.services.hashing_service import generate_hash
from app.services.blockchain_service import log_evidence

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
        case_id = f"case_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # 2. Sequential Service Pipeline
        file_path = save_file(uploaded_file)
        file_hash = generate_hash(uploaded_file)
        log_evidence(case_id, file_hash, timestamp)
        
        return jsonify({
            "case_id": case_id,
            "hash": file_hash,
            "file_path": file_path,
            "status": "stored"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

def collect_evidence(request):
    """Placeholder for automated script collection logic."""
    pass
