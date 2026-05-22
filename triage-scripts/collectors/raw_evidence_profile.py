import mimetypes
import os
from datetime import datetime, timezone

from utils.file_handler import save_json
from utils.logger import log_info


def _resolve_file_type(filepath: str) -> str:
    mime_type, _ = mimetypes.guess_type(filepath)
    if mime_type:
        return mime_type

    extension = os.path.splitext(filepath)[1].lstrip(".").lower()
    return extension or "unknown"


def extract_raw_evidence_profile(input_path: str, output_path: str) -> str:
    """Builds a compact forensic profile for a submitted evidence file."""
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Evidence file not found at {input_path}")

    log_info(f"Profiling raw evidence file: {input_path}")
    stat_info = os.stat(input_path)
    created_at = datetime.fromtimestamp(stat_info.st_ctime, timezone.utc)
    modification_at = datetime.fromtimestamp(stat_info.st_mtime, timezone.utc)

    with open(input_path, "rb") as evidence_file:
        memory_preview = evidence_file.read(128)

    profile = {
        "artifact_type": "raw_evidence_profile",
        "source_path": os.path.abspath(input_path),
        "cache_path": os.path.abspath(output_path),
        "file_name": os.path.basename(input_path),
        "file_type": _resolve_file_type(input_path),
        "file_size_bytes": stat_info.st_size,
        "created_at": created_at.isoformat(),
        "created_day": created_at.strftime("%A"),
        "modified_at": modification_at.isoformat(),
        "memory_preview_hex": memory_preview.hex(),
        "memory_preview_size_bytes": len(memory_preview),
        "cache_state": "profile_saved",
    }

    return save_json(output_path, profile)