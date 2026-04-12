from flask import jsonify, send_file

from app.services.audit_service import generate_audit_trail_pdf, get_audit_summary_for_case


def download_audit_report(case_id=None):
    """Generates and downloads an audit trail PDF for the requested or latest case."""
    try:
        result = generate_audit_trail_pdf(case_id)
        return send_file(
            result["pdf_path"],
            as_attachment=True,
            download_name=f"audit_trail_{result['case_id']}.pdf",
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Server Error: {str(exc)}"}), 500


def audit_summary(case_id=None):
    """Returns a JSON summary of the audit trail for a case or latest case."""
    try:
        summary = get_audit_summary_for_case(case_id)
        return jsonify({"status": "success", "summary": summary}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Server Error: {str(exc)}"}), 500
