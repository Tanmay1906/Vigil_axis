import hashlib
from utils.logger import log_info, log_error

def generate_file_hash(filepath):
    """
    Safely generates a SHA-256 hex digest for a requested evidence file structurally mapping chunks cleanly.
    """
    log_info(f"Initiating SHA-256 fingerprint operation for: {filepath}")
    hasher = hashlib.sha256()
    
    try:
        with open(filepath, 'rb') as f:
            chunk = f.read(4096)
            while chunk:
                hasher.update(chunk)
                chunk = f.read(4096)
        return hasher.hexdigest()
    except Exception as e:
        log_error(f"Hashing process failed: {str(e)}")
        raise e
