import requests
import sys

BASE_URL = "http://127.0.0.1:5000"

def run_tests():
    print("\n--- VIGIL-AXIS End-to-End Route Validation ---")
    
    # 0. Check connection
    try:
        health_resp = requests.get(f"{BASE_URL}/health")
        if health_resp.status_code not in [200, 201]:
            print(f"Warning: Server returned {health_resp.status_code}.")
    except requests.exceptions.ConnectionError:
        print("ERROR: Connection refused. Is Flask running on 127.0.0.1:5000?")
        sys.exit(1)

    case_id = None
    file_hash = None

    # A. Test Evidence Upload
    print("\n[1] Testing Evidence Upload...")
    try:
        files = {'file': ('mock_disk.bin', b'Forensic disk array payload data.', 'application/octet-stream')}
        response = requests.post(f"{BASE_URL}/api/v1/evidence/upload", files=files)
        
        if response.status_code in [200, 201]:
            data = response.json()
            case_id = data.get('case_id')
            file_hash = data.get('hash')
             
            if case_id and file_hash:
                print("UPLOAD SUCCESS")
            else:
                print("UPLOAD FAIL: Missing JSON fields.")
                sys.exit(1)
        else:
            print(f"UPLOAD FAIL. Code: {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"Upload process failed: {str(e)}")
        sys.exit(1)

    # B. Test Verification
    print(f"\n[2] Testing Verification for case: {case_id}...")
    try:
        payload = {
            'case_id': case_id,
            'hash': file_hash
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/verification/", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'VERIFIED':
                print("VERIFICATION SUCCESS")
            else:
                print(f"VERIFICATION FAIL. Got {data.get('status')}")
        else:
            print(f"VERIFICATION FAIL. Code {response.status_code}")
    except Exception as e:
        print(f"Verification process failed: {str(e)}")

    # C. Test Report Generation
    print(f"\n[3] Testing Report Generation for case: {case_id}...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/reports/{case_id}")
        
        if response.status_code == 200:
            data = response.json()
            report_data = data.get('report', {})
            
            if report_data.get('certificate_status') == 'generated':
                print("REPORT GENERATED")
            else:
                print("REPORT FLAG FAIL. Missing flag.")
        else:
            print(f"REPORT GENERATION FAIL. Code {response.status_code}")
    except Exception as e:
        print(f"Report process failed: {str(e)}")

if __name__ == '__main__':
    run_tests()
