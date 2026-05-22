import mimetypes
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
    created_at = datetime.fromtimestamp(stat_info.st_ctime, timezone.utc)
    modification_at = datetime.fromtimestamp(stat_info.st_mtime, timezone.utc)
    mime_type, _ = mimetypes.guess_type(filepath)
    file_type = mime_type or os.path.splitext(filepath)[1].lstrip(".").lower() or "unknown"

    with open(filepath, "rb") as artifact_file:
        memory_preview = artifact_file.read(64)
    
    return {
        "file_name": os.path.basename(filepath),
        "file_type": file_type,
        "file_size_bytes": stat_info.st_size,
        "creation_time": created_at.isoformat(),
        "created_day": created_at.strftime("%A"),
        "modification_time": modification_at.isoformat(),
        "cache_path": os.path.abspath(filepath),
        "cache_state": "stored_on_disk",
        "memory_preview_hex": memory_preview.hex(),
        "memory_preview_size_bytes": len(memory_preview),
    }
