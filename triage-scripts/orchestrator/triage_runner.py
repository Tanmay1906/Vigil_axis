import os
import sys
import requests
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collectors.chrome_history import extract_chrome_history
from processors.hash_generator import generate_file_hash
from processors.metadata_extractor import extract_metadata
from utils.logger import log_info, log_error

API_URL = "http://127.0.0.1:5000/api/v1/evidence/upload"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "extraction_output")

def run_triage():
    log_info("--- VIGIL-AXIS TRIAGE SYSTEM INITIALIZED ---")
    
    try:
        # STEP 1: Collection
        artifact_path = os.path.join(OUTPUT_DIR, "chrome_history_extraction.json")
        saved_file = extract_chrome_history(artifact_path)
        
        # STEP 2: Processing
        file_hash = generate_file_hash(saved_file)
        metadata = extract_metadata(saved_file)
        
        log_info(f"Artifact Hash Generated: {file_hash}")
        log_info(f"Metadata Extracted: \n{json.dumps(metadata, indent=2)}")
        
        # STEP 3: API Pipeline Upload
        log_info("Pushing artifact securely to VIGIL-AXIS backend node...")
        with open(saved_file, 'rb') as f:
            files = {'file': (metadata["file_name"], f, 'application/json')}
            response = requests.post(API_URL, files=files)
            
            if response.status_code in [200, 201]:
                 data = response.json()
                 log_info("--- TRIAGE EXTRACTION SUCCESS ---")
                 log_info(f"Secured Case ID: {data.get('case_id')}")
                 log_info(f"Blockchain Anchor: {data.get('hash')}")
            else:
                 log_error(f"API rejection Code: {response.status_code}")
                 log_error(response.text)
                 
    except Exception as e:
        log_error(f"Critical exception encountered during orchestrator sequence: {str(e)}")

        
if __name__ == '__main__':
    run_triage()
