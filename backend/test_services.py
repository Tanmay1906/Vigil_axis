import sys
import os
import io
import json
import uuid
import datetime

# Ensure correct path resolution for framework imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.hashing_service import generate_hash
from app.services.blockchain_service import log_evidence, get_evidence_hash
from app.services.pdf_service import generate_pdf_report
from app.services.storage_service import save_file

class MockFileStorage:
    """Minimal Werkzeug FileStorage mock wrapper for testing file streams."""
    def __init__(self, stream, filename):
        self.stream = stream
        self.filename = filename

    def read(self, *args):
        return self.stream.read(*args)

    def seek(self, *args):
        return self.stream.seek(*args)
        
    def save(self, filepath):
        """Simulate saving the file physically to disk."""
        with open(filepath, 'wb') as f:
            self.stream.seek(0)
            f.write(self.stream.read())

def run_tests():
    """
    Simulates the full VIGIL-AXIS extraction pipeline sequence.
    """
    print("\n--- VIGIL-AXIS SERVICE TEST HARNESS ---")
    
    # 1. Create Mock File Stream
    mock_data = b"Simulated forensic triage artifact payload testing structure."
    mock_stream = io.BytesIO(mock_data)
    mock_file = MockFileStorage(mock_stream, "triage_artifact_mock.bin")
    
    case_id = f"case_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.datetime.utcnow().isoformat()
    
    try:
        # a. HASH 
        hash_result = generate_hash(mock_file)
        print(f"HASH GENERATED: {hash_result}")
        
        # b. BLOCKCHAIN 
        tx_id = log_evidence(case_id, hash_result, timestamp)
        print("BLOCKCHAIN STORED")
        
        # c. VERIFY
        retrieved_hash = get_evidence_hash(case_id)
        if retrieved_hash == hash_result:
            print("HASH VERIFIED: SUCCESS")
        else:
            print("HASH VERIFIED: FAIL")
            
        # d. SAVE FILE
        saved_path = save_file(mock_file)
        print(f"FILE SAVED AT: {saved_path}")
        
        # e. CERTIFICATE
        cert_json = generate_pdf_report(case_id, hash_result)
        formatted_json = json.dumps(cert_json, indent=2)
        print(f"CERTIFICATE GENERATED: \n{formatted_json}")
        
    except Exception as e:
        print(f"TEST HARNESS EXCEPTION CAUGHT: {str(e)}")

if __name__ == '__main__':
    print("INTERPRETER PATH:", sys.executable)
    run_tests()
