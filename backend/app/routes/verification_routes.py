from flask import Blueprint, request, jsonify
from app.controllers.verification_controller import verify_evidence
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
