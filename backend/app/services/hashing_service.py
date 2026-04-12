import hashlib
import os
from ..utils.logger import get_sys_logger

logger = get_sys_logger(__name__)

def generate_hash(file_stream) -> str:
    """
    Computes a SHA-256 hash securely natively.
    Safely chunks the reading process to prevent memory exhaustion, and cleanly
    resets the pointer so the upstream tools can still interact with the file.
    
    Args:
        file_stream: Werkzeug HTTP File Storage stream or standard Python stream.
        
    Returns:
        str: Hexadecimal SHA-256 hash indicating digital fingerprint.
    """
    hasher = hashlib.sha256()
    
    try:
        if isinstance(file_stream, str) and os.path.exists(file_stream):
            logger.info("Hashing process initiated on file path.")
            with open(file_stream, "rb") as handle:
                while True:
                    chunk = handle.read(4096)
                    if not chunk:
                        break
                    hasher.update(chunk)
        elif hasattr(file_stream, 'read'):
            logger.info("Hashing process initiated on file stream.")
            if hasattr(file_stream, 'seek'):
                file_stream.seek(0)
            while True:
                chunk = file_stream.read(4096)
                if not chunk:
                    break
                
                if isinstance(chunk, str):
                    chunk = chunk.encode('utf-8')
                    
                hasher.update(chunk)
        elif isinstance(file_stream, str):
            logger.info("Hashing process initiated on raw string.")
            hasher.update(file_stream.encode('utf-8'))
        else:
            raise ValueError("Unsupported input format for hashing.")
            
    except Exception as e:
        logger.error(f"Hashing sequence failed: {str(e)}")
        raise ValueError(f"Failed cleanly: {str(e)}")
    
    finally:
        # Crucial requirement intelligently resetting the pointer
        if hasattr(file_stream, 'seek'):
            file_stream.seek(0)
            
    return hasher.hexdigest()
