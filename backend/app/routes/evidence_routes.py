from flask import Blueprint, request, jsonify
from app.controllers.evidence_controller import upload_evidence, collect_evidence
from app.utils.validators import validate_file_presence

evidence_bp = Blueprint('evidence_bp', __name__)

@evidence_bp.route('/upload', methods=['POST'])
def handle_upload():
    """
    POST /upload
    Accepts physical forensic file streams.
    Validates file presence securely and passes orchestration logic strictly to the controller.
    """
    if 'file' not in request.files or not validate_file_presence(request.files, 'file'):
        return jsonify({"error": "No file provided"}), 400
        
    return upload_evidence(request)

@evidence_bp.route('/collect', methods=['POST'])
def handle_collect():
    """
    POST /collect
    Triggers simulated automated triage extraction.
    """
    collect_evidence(request)
    return jsonify({"message": "Triage collection mocked dynamically successfully."}), 200
