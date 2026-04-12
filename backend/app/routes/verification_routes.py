from flask import Blueprint, request, jsonify
from app.controllers.verification_controller import (
    get_verification_source,
    get_verification_source_by_evidence,
    list_verification_cases,
    verify_evidence,
)
from app.utils.validators import validate_json_structure

verification_bp = Blueprint('verification_bp', __name__)

@verification_bp.route('/', methods=['POST'])
def handle_verification():
    """
    POST /
    Validates blockchain checksum properties strictly.
    """
    data = request.get_json()
    if not validate_json_structure(data, ['case_id', 'hash']):
        return jsonify({"error": "Missing required fields: case_id or hash"}), 400
        
    return verify_evidence(request)


@verification_bp.route('/cases', methods=['GET'])
def handle_case_list():
    return list_verification_cases()


@verification_bp.route('/source/<case_id>', methods=['GET'])
def handle_case_source(case_id):
    return get_verification_source(case_id)


@verification_bp.route('/source/evidence/<evidence_id>', methods=['GET'])
def handle_evidence_source(evidence_id):
    return get_verification_source_by_evidence(evidence_id)
