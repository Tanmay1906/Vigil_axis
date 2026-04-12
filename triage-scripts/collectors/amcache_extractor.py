import os
import re
import subprocess
from datetime import datetime, timezone

from utils.file_handler import save_json
from utils.logger import log_info

REGISTRY_EXECUTION_KEY = r"HKCU\Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Compatibility Assistant\Store"


def _parse_reg_query(stdout: str) -> list[dict]:
    entries: list[dict] = []
    pattern = re.compile(r"^\s*(?P<path>[A-Za-z]:\\.+?)\s+REG_\w+\s+(?P<value>.+)$")

    for line in stdout.splitlines():
        match = pattern.match(line)
        if not match:
            continue

        executable_path = match.group("path").strip()
        value = match.group("value").strip()
        entries.append(
            {
                "artifact_type": "amcache_execution_history",
                "executable_path": executable_path,
                "registry_value": value,
                "observed_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    return entries


def extract_amcache_history(output_path: str) -> str:
    """Extracts application execution traces from Windows compatibility assistant registry store."""
    if os.name != "nt":
        raise OSError("amcache_extractor is supported only on Windows hosts.")

    log_info("Collecting application execution history from Windows compatibility store...")
    result = subprocess.run(
        ["reg", "query", REGISTRY_EXECUTION_KEY],
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Registry query failed: {result.stderr.strip()}")

    entries = _parse_reg_query(result.stdout)
    return save_json(output_path, entries)
