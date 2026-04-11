import os
import sys
import json
import subprocess
import requests
from web3 import Web3

# Path configurations
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://127.0.0.1:5000"
RPC_URL = os.environ.get("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRIAGE_SCRIPT_PATH = os.path.join(BASE_DIR, "triage-scripts", "orchestrator", "triage_runner.py")
DEPLOYED_CONFIG_PATH = os.path.join(BASE_DIR, "blockchain", "deployed_contract.json")

def get_web3_contract():
    if not os.path.exists(DEPLOYED_CONFIG_PATH):
        print("ERROR: Contract not deployed. Run deploy.js first.")
        sys.exit(1)
        
    with open(DEPLOYED_CONFIG_PATH, 'r') as f:
        config = json.load(f)
        
    contract_address = config.get("EvidenceRegistry")
    if not contract_address:
         print("ERROR: EvidenceRegistry address missing from configuration.")
         sys.exit(1)
         
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print(f"ERROR: Cannot connect to Hardhat node at {RPC_URL}")
        sys.exit(1)
        
    abi_path = os.path.join(BASE_DIR, "blockchain", config.get("abi_path", "artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"))
    if not os.path.exists(abi_path):
        print(f"ERROR: ABI missing. Attempted Path: {abi_path}")
        sys.exit(1)
        
    with open(abi_path, "r") as f:
        artifact = json.load(f)
        
    contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=artifact['abi'])
    return w3, contract

def run_tests():
    print("--- BLOCKCHAIN INTEGRATION TEST ---\n")
    
    # Validation Pre-check
    w3, contract = get_web3_contract()
    
    try:
        requests.get(BASE_URL)
    except:
        print("ERROR: Backend Flask server not running.")
        sys.exit(1)

    # STEP 1: Run Triage Script Automatically
    case_id = None
    triage_hash = None
    
    try:
        result = subprocess.run([sys.executable, TRIAGE_SCRIPT_PATH], capture_output=True, text=True)
        
        for line in result.stdout.split('\n') + result.stderr.split('\n'):
            if "Secured Case ID:" in line:
                case_id = line.split(":")[-1].strip()
            if "Blockchain Anchor:" in line:
                triage_hash = line.split(":")[-1].strip()
                
        if not case_id or not triage_hash:
            print("ERROR: STEP 1 FAILED - Failed to extract case_id or hash from triage.")
            print("Subprocess stdout:", result.stdout)
            sys.exit(1)
            
        print("STEP 1: TRIAGE SUCCESS")
    except Exception as e:
        print(f"ERROR: STEP 1 FAILED - {str(e)}")
        sys.exit(1)

    # STEP 2: Verify Backend Reports
    try:
        response = requests.get(f"{BASE_URL}/api/v1/reports/{case_id}")
        if response.status_code == 200:
            report_data = response.json().get('report', {})
            backend_hash = report_data.get('hash')
            if backend_hash == triage_hash:
                print("STEP 2: BACKEND + BLOCKCHAIN MATCH")
            else:
                 print(f"ERROR: STEP 2 FAILED - Hash mismatch! Expected {triage_hash}, got {backend_hash}")
                 sys.exit(1)
        else:
             print(f"ERROR: STEP 2 FAILED - Unexpected API response code {response.status_code}")
             sys.exit(1)
    except Exception as e:
        print(f"ERROR: STEP 2 FAILED - {str(e)}")
        sys.exit(1)

    # STEP 3: Direct Blockchain Verification
    try:
        result = contract.functions.getEvidence(case_id).call()
        chain_hash = result[1]
        
        if chain_hash == triage_hash:
             print("STEP 3: DIRECT CONTRACT MATCH")
        else:
             print(f"ERROR: STEP 3 FAILED - Direct EVM hash mismatched. Expected {triage_hash}, got {chain_hash}")
             sys.exit(1)
    except Exception as e:
        print(f"ERROR: STEP 3 FAILED - Smart Contract Call failed: {str(e)}")
        sys.exit(1)

    # STEP 4: Tampering Test
    try:
        tampered_hash = triage_hash + "xyz"
        payload = {
            'case_id': case_id,
            'hash': tampered_hash
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/verification/", json=payload)
        status_result = response.json().get('status')
        
        if status_result == "TAMPERED":
            print("STEP 4: TAMPERING DETECTED")
        else:
            print(f"ERROR: STEP 4 FAILED - Tampering status failed: {status_result}")
            sys.exit(1)
            
    except Exception as e:
         print(f"ERROR: STEP 4 FAILED - Request failed: {str(e)}")
         sys.exit(1)

    print("\nALL SYSTEMS VERIFIED ON-CHAIN")

if __name__ == '__main__':
    run_tests()
