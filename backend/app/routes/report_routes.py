from flask import Blueprint, request, jsonify
from app.controllers.report_controller import generate_report

report_bp = Blueprint('report_bp', __name__)

@report_bp.route('/<case_id>', methods=['GET'])
def handle_report(case_id):
    """
    GET /<case_id>
    Extracts explicit case_id from the cleanly structurally URL.
    """
    return generate_report(case_id, request=request)
