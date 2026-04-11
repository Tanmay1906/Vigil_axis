import requests
import sys

BASE_URL = "http://127.0.0.1:5000"

def run_tests():
    print("--- VIGIL-AXIS FULL SYSTEM TEST ---\n")
    
    # STEP 0: Server Check
    # We attempt a basic GET request to verify the port is actively bound.
    # We catch the ConnectionError specifically to ensure the server is alive.
    try:
        requests.get(BASE_URL)
    except requests.exceptions.ConnectionError:
        print("ERROR: Backend server not running")
        sys.exit(1)

    case_id = None
    file_hash = None

    # STEP 1: Evidence Upload
    try:
        # Pushing a mock structural file to explicitly trigger parsing, hashing, and storage
        files = {'file': ('mock_triage_image.bin', b'Forensic memory snapshot exact payload bytes', 'application/octet-stream')}
        response = requests.post(f"{BASE_URL}/api/v1/evidence/upload", files=files)
        
        if response.status_code in [200, 201]:
            data = response.json()
            case_id = data.get('case_id')
            file_hash = data.get('hash')
            if case_id and file_hash:
                print("STEP 1 PASSED: Evidence Uploaded")
            else:
                print("ERROR: STEP 1 FAILED - Missing JSON fields in response.")
                sys.exit(1)
        else:
            print(f"ERROR: STEP 1 FAILED - Unexpected status code: {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: STEP 1 FAILED Exception: {str(e)}")
        sys.exit(1)

    # STEP 2: Verification
    try:
        payload = {
            'case_id': case_id,
            'hash': file_hash
        }
        # Hitting the verification route initialized by the Flask blueprint
        response = requests.post(f"{BASE_URL}/api/v1/verification/", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'VERIFIED':
                print("STEP 2 PASSED: Verification Successful")
            else:
                print(f"ERROR: STEP 2 FAILED - Status returned: {data.get('status')}")
                sys.exit(1)
        else:
            print(f"ERROR: STEP 2 FAILED - Unexpected status code: {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: STEP 2 FAILED Exception: {str(e)}")
        sys.exit(1)

    # STEP 3: Tampering Simulation
    try:
        # Modifying the original securely anchored hash slightly to trigger conflict detection
        wrong_hash = file_hash + "xyz"
        tampered_payload = {
            'case_id': case_id,
            'hash': wrong_hash
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/verification/", json=tampered_payload)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'TAMPERED':
                 print("STEP 3 PASSED: Tampering Detected")
            else:
                 print(f"ERROR: STEP 3 FAILED - Did not detect tampering. Returned: {data.get('status')}")
                 sys.exit(1)
        else:
             print(f"ERROR: STEP 3 FAILED - Expected 200 logic return, got {response.status_code}")
             sys.exit(1)
    except Exception as e:
        print(f"ERROR: STEP 3 FAILED Exception: {str(e)}")
        sys.exit(1)

    # STEP 4: Report Generation
    try:
        # Hitting the URL-parameter mapped endpoint cleanly
        response = requests.get(f"{BASE_URL}/api/v1/reports/{case_id}")
        
        if response.status_code == 200:
            data = response.json()
            report_data = data.get('report', {})
            if report_data.get('certificate_status') == 'generated':
                print("STEP 4 PASSED: Report Generated")
            else:
                print(f"ERROR: STEP 4 FAILED - Missing generated flag. Response: {report_data}")
                sys.exit(1)
        else:
            print(f"ERROR: STEP 4 FAILED - Unexpected status code: {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: STEP 4 FAILED Exception: {str(e)}")
        sys.exit(1)
        
    print("\nALL SYSTEMS OPERATIONAL")

if __name__ == '__main__':
    run_tests()
