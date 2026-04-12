from flask import Blueprint, request

from app.controllers.audit_controller import audit_summary, download_audit_report

audit_bp = Blueprint("audit_bp", __name__)


@audit_bp.route("/summary", methods=["GET"])
@audit_bp.route("/summary/<case_id>", methods=["GET"])
def handle_audit_summary(case_id=None):
    return audit_summary(case_id or request.args.get("case_id"))


@audit_bp.route("/report", methods=["GET"])
@audit_bp.route("/report/<case_id>", methods=["GET"])
def handle_audit_report(case_id=None):
    return download_audit_report(case_id or request.args.get("case_id"))
