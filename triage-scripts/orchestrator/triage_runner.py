import os
import sys
import requests
import json
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collectors.chrome_history import extract_chrome_history
from collectors.amcache_extractor import extract_amcache_history
from collectors.chrome_predictor import extract_chrome_predictor_intent
from collectors.ram_capture import extract_ram_snapshot
from collectors.raw_evidence_profile import extract_raw_evidence_profile
from processors.hash_generator import generate_file_hash
from processors.metadata_extractor import extract_metadata
from utils.file_handler import save_json
from utils.logger import log_info, log_error

API_URL = "http://127.0.0.1:5000/api/v1/evidence/upload"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "extraction_output")

def run_triage():
    log_info("--- VIGIL-AXIS TRIAGE SYSTEM INITIALIZED ---")
    
    try:
        # STEP 1: Collection
        evidence_input_path = os.environ.get("EVIDENCE_FILE_PATH", "").strip()
        raw_evidence_profile_path = None
        if evidence_input_path:
            raw_evidence_profile_path = extract_raw_evidence_profile(
                evidence_input_path,
                os.path.join(OUTPUT_DIR, "raw_evidence_profile.json"),
            )
        ram_snapshot_path = extract_ram_snapshot(
            os.path.join(OUTPUT_DIR, "ram_snapshot.json"),
            evidence_path=evidence_input_path or None,
        )

        chrome_history_path = extract_chrome_history(os.path.join(OUTPUT_DIR, "chrome_history_extraction.json"))
        amcache_path = extract_amcache_history(os.path.join(OUTPUT_DIR, "amcache_extraction.json"))
        chrome_predictor_path = extract_chrome_predictor_intent(os.path.join(OUTPUT_DIR, "chrome_predictor_extraction.json"))

        artifacts = [
            *(
                [
                    {
                        "artifact_type": "raw_evidence_profile",
                        "path": raw_evidence_profile_path,
                        "hash": generate_file_hash(raw_evidence_profile_path),
                        "metadata": extract_metadata(raw_evidence_profile_path),
                    }
                ]
                if raw_evidence_profile_path
                else []
            ),
            {
                "artifact_type": "ram_snapshot",
                "path": ram_snapshot_path,
                "hash": generate_file_hash(ram_snapshot_path),
                "metadata": extract_metadata(ram_snapshot_path),
            },
            {
                "artifact_type": "chrome_history",
                "path": chrome_history_path,
                "hash": generate_file_hash(chrome_history_path),
                "metadata": extract_metadata(chrome_history_path),
            },
            {
                "artifact_type": "amcache_execution_history",
                "path": amcache_path,
                "hash": generate_file_hash(amcache_path),
                "metadata": extract_metadata(amcache_path),
            },
            {
                "artifact_type": "chrome_network_predictor",
                "path": chrome_predictor_path,
                "hash": generate_file_hash(chrome_predictor_path),
                "metadata": extract_metadata(chrome_predictor_path),
            },
        ]

        bundle = {
            "evidence_id": f"evd_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "source": "triage_orchestrator",
            "investigator": os.environ.get("INVESTIGATOR_ID", "TRIAGE_INVESTIGATOR"),
            "collector": os.environ.get("COLLECTOR_ID", "TRIAGE_COLLECTOR"),
            "submitter": os.environ.get("SUBMITTER_ID", "TRIAGE_SUBMITTER"),
            "artifacts": artifacts,
        }
        bundle_path = os.path.join(OUTPUT_DIR, "evidence_bundle.json")
        saved_file = save_json(bundle_path, bundle)
        bundle_hash = generate_file_hash(saved_file)

        log_info(f"Artifact Bundle Hash Generated: {bundle_hash}")
        log_info(f"Artifact Summary: {json.dumps([a['artifact_type'] for a in artifacts])}")
        if evidence_input_path:
            log_info(f"Raw evidence profile generated for: {evidence_input_path}")

        # STEP 3: API Pipeline Upload
        log_info("Pushing artifact securely to VIGIL-AXIS backend node...")
        with open(saved_file, 'rb') as f:
            metadata = extract_metadata(saved_file)
            files = {'file': (metadata["file_name"], f, 'application/json')}
            data = {
                "investigator": bundle["investigator"],
                "collector": bundle["collector"],
                "submitter": bundle["submitter"],
            }
            response = requests.post(API_URL, files=files, data=data)
            
            if response.status_code in [200, 201]:
                 data = response.json()
                 log_info("--- TRIAGE EXTRACTION SUCCESS ---")
                 log_info(f"Secured Case ID: {data.get('case_id')}")
                 log_info(f"Blockchain Anchor: {data.get('hash')}")
                 log_info(f"On-Chain TXID: {data.get('txid')}")
            else:
                 log_error(f"API rejection Code: {response.status_code}")
                 log_error(response.text)
                 raise RuntimeError(f"Backend upload failed with HTTP {response.status_code}")
                 
    except Exception as e:
        log_error(f"Critical exception encountered during orchestrator sequence: {str(e)}")
        raise

        
if __name__ == '__main__':
    run_triage()
