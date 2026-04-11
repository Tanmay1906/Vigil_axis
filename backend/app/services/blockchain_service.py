import os
import json
from web3 import Web3
from datetime import datetime
from app.utils.logger import get_sys_logger

logger = get_sys_logger(__name__)

# Config
RPC_URL = os.environ.get("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
PRIVATE_KEY = os.environ.get("PRIVATE_KEY")

# Resolve absolute path to the deployed_contract.json
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BLOCKCHAIN_DIR = os.path.join(os.path.dirname(BASE_DIR), 'blockchain')
DEPLOYED_CONFIG_PATH = os.path.join(BLOCKCHAIN_DIR, 'deployed_contract.json')

def get_web3_instance():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        raise ConnectionError(f"Failed to connect to RPC at {RPC_URL}")
    return w3

def load_contract_config():
    """
    Reads dynamic JSON file tracking deployment.
    """
    if not os.path.exists(DEPLOYED_CONFIG_PATH):
        raise FileNotFoundError("Contract not deployed. Run deploy.js first.")
        
    with open(DEPLOYED_CONFIG_PATH, 'r') as f:
        config = json.load(f)
        
    return config

def get_contract(w3):
    config = load_contract_config()
    contract_address = config.get("EvidenceRegistry")
    
    if not contract_address:
         raise ValueError("EvidenceRegistry missing from configuration.")
         
    abi_rel_path = config.get("abi_path", "artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json")
    abi_path = os.path.join(BLOCKCHAIN_DIR, abi_rel_path)
    
    if not os.path.exists(abi_path):
        raise FileNotFoundError(f"Contract ABI not found at {abi_path}.")
        
    with open(abi_path, 'r') as f:
        artifact = json.load(f)
        
    contract_abi = artifact['abi']
    checksum_address = w3.to_checksum_address(contract_address)
    
    return w3.eth.contract(address=checksum_address, abi=contract_abi)

def log_evidence(case_id: str, file_hash: str, timestamp_iso: str) -> str:
    """
    Logs evidence immutably.
    """
    w3 = get_web3_instance()
    contract = get_contract(w3)
    
    try:
        dt = datetime.fromisoformat(timestamp_iso.replace('Z', '+00:00'))
        uint_timestamp = int(dt.timestamp())
    except ValueError:
        logger.warning(f"Invalid timestamp format {timestamp_iso}. Using current block time.")
        uint_timestamp = int(w3.eth.get_block('latest')['timestamp'])

    try:
        if PRIVATE_KEY:
            account = w3.eth.account.from_key(PRIVATE_KEY)
            sender = account.address
            nonce = w3.eth.get_transaction_count(sender)
            
            tx = contract.functions.addEvidence(case_id, file_hash, uint_timestamp).build_transaction({
                'from': sender,
                'nonce': nonce,
                'gas': 3000000,
                'gasPrice': w3.eth.gas_price
            })
            
            signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        else:
            sender = w3.eth.accounts[0]
            tx_hash = contract.functions.addEvidence(case_id, file_hash, uint_timestamp).transact({'from': sender})
            
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        receipt_hex = receipt.transactionHash.hex()
        logger.info(f"Blockchain TX Success: {receipt_hex}")
        return receipt_hex
        
    except Exception as e:
        logger.error(f"Blockchain transaction failed: {str(e)}")
        raise e

def get_evidence_hash(case_id: str) -> str:
    """
    Retrieves evidence hash from the contract.
    """
    try:
        w3 = get_web3_instance()
        contract = get_contract(w3)
        
        result = contract.functions.getEvidence(case_id).call()
        return result[1]
    
    except Exception as e:
        logger.error(f"Blockchain retrieval failed: {str(e)}")
        return None
