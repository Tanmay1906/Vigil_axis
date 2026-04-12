import argparse
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

from app.services.audit_service import generate_audit_trail_pdf


def main() -> int:
    load_dotenv()

    parser = argparse.ArgumentParser(description="Generate a VIGIL-AXIS audit trail PDF report.")
    parser.add_argument("--case-id", dest="case_id", default=None, help="Case ID to report on. Defaults to latest case.")
    parser.add_argument("--output-dir", dest="output_dir", default=None, help="Directory to store the PDF report.")
    parser.add_argument("--json", dest="emit_json", action="store_true", help="Print JSON summary instead of plain text.")
    args = parser.parse_args()

    result = generate_audit_trail_pdf(case_id=args.case_id, output_dir=args.output_dir)

    if args.emit_json:
        print(json.dumps(result, indent=2, default=str))
    else:
        print(f"Audit report generated: {result['pdf_path']}")
        print(f"Case ID: {result['case_id']}")
        print(f"Case TXN Hash: {result['summary']['case']['case_txn_hash']}")
        print(f"Events: {len(result['summary']['audit_trail'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
