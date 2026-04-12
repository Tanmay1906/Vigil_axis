from flask import jsonify
from app.services.pdf_service import generate_certificate
from app.services.audit_service import get_audit_summary_for_case, log_audit_event

def generate_report(case_id, request=None):
    """
    Orchestrates data fetching to safely deploy the BSA structural certificate JSON.
    """
    try:
        if not case_id:
             return jsonify({"error": "Invalid case_id."}), 404
             
        investigator = request.args.get("investigator", "UNKNOWN_INVESTIGATOR") if request else "UNKNOWN_INVESTIGATOR"
        collector = request.args.get("collector", "UNKNOWN_COLLECTOR") if request else "UNKNOWN_COLLECTOR"
        submitter = request.args.get("submitter", "UNKNOWN_SUBMITTER") if request else "UNKNOWN_SUBMITTER"

        cert_json = generate_certificate(
            case_id=case_id,
            investigator=investigator,
            collector=collector,
            submitter=submitter,
        )

        summary = get_audit_summary_for_case(case_id)
        evidence_id = summary["evidence"][0]["evidence_id"] if summary["evidence"] else None
        log_audit_event(
            action="AUDIT_REPORT_GENERATED",
            actor=submitter,
            case_id=case_id,
            evidence_id=evidence_id,
            txid=cert_json.get("txid"),
            details={
                "pdf_path": cert_json.get("pdf_path"),
                "generated_at": cert_json.get("generated_at"),
            },
        )
        
        return jsonify({
            'status': 'success',
            'case_id': case_id,
            'report': cert_json
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500
