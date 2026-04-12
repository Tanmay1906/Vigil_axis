from flask import Blueprint, request, jsonify
from app.controllers.evidence_controller import upload_evidence, collect_evidence, create_case, list_case_records
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
    Triggers automated triage extraction and backend ingestion sync.
    """
    return collect_evidence(request)


@evidence_bp.route('/cases', methods=['POST'])
def handle_create_case():
    """Creates a case record so evidence can be linked to an existing case number later."""
    return create_case(request)


@evidence_bp.route('/cases', methods=['GET'])
def handle_list_cases():
    """Returns registered case numbers and metadata."""
    return list_case_records(request)
