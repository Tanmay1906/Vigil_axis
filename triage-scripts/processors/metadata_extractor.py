import os
from datetime import datetime, timezone
from utils.logger import log_info

def extract_metadata(filepath):
    """
    Extracts underlying physical OS metadata from the targeted forensic artifact.
    """
    log_info(f"Extracting OS metadata for: {filepath}")
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Missing artifact: {filepath}")
        
    stat_info = os.stat(filepath)
    
    return {
        "file_name": os.path.basename(filepath),
        "file_size_bytes": stat_info.st_size,
        "creation_time": datetime.fromtimestamp(stat_info.st_ctime, timezone.utc).isoformat(),
        "modification_time": datetime.fromtimestamp(stat_info.st_mtime, timezone.utc).isoformat()
    }
