import csv
import ctypes
import io
import os
import subprocess
from datetime import datetime, timezone

from utils.file_handler import save_json
from utils.logger import log_info


class _MemoryStatusEx(ctypes.Structure):
	_fields_ = [
		("dwLength", ctypes.c_ulong),
		("dwMemoryLoad", ctypes.c_ulong),
		("ullTotalPhys", ctypes.c_ulonglong),
		("ullAvailPhys", ctypes.c_ulonglong),
		("ullTotalPageFile", ctypes.c_ulonglong),
		("ullAvailPageFile", ctypes.c_ulonglong),
		("ullTotalVirtual", ctypes.c_ulonglong),
		("ullAvailVirtual", ctypes.c_ulonglong),
		("ullAvailExtendedVirtual", ctypes.c_ulonglong),
	]


def _collect_system_memory() -> dict:
	if os.name == "nt":
		status = _MemoryStatusEx()
		status.dwLength = ctypes.sizeof(_MemoryStatusEx)
		if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)) == 0:
			raise OSError("GlobalMemoryStatusEx call failed")

		used_bytes = status.ullTotalPhys - status.ullAvailPhys
		return {
			"total_physical_bytes": int(status.ullTotalPhys),
			"available_physical_bytes": int(status.ullAvailPhys),
			"used_physical_bytes": int(used_bytes),
			"memory_load_percent": int(status.dwMemoryLoad),
		}

	page_size = os.sysconf("SC_PAGE_SIZE")
	total_pages = os.sysconf("SC_PHYS_PAGES")
	avail_pages = os.sysconf("SC_AVPHYS_PAGES")
	total = int(page_size * total_pages)
	avail = int(page_size * avail_pages)
	return {
		"total_physical_bytes": total,
		"available_physical_bytes": avail,
		"used_physical_bytes": total - avail,
		"memory_load_percent": int(((total - avail) / total) * 100) if total else 0,
	}


def _parse_tasklist_mem_usage(mem_usage: str) -> int:
	normalized = mem_usage.replace("K", "").replace("k", "").replace(",", "").strip()
	return int(normalized) * 1024 if normalized.isdigit() else 0


def _collect_top_processes(limit: int = 10) -> list[dict]:
	if os.name != "nt":
		return []

	result = subprocess.run(
		["tasklist", "/FO", "CSV", "/NH"],
		capture_output=True,
		text=True,
		check=False,
	)
	if result.returncode != 0:
		return []

	reader = csv.reader(io.StringIO(result.stdout))
	records = []
	for row in reader:
		if len(row) < 5:
			continue
		records.append(
			{
				"image_name": row[0],
				"pid": row[1],
				"session_name": row[2],
				"session_num": row[3],
				"mem_usage_bytes": _parse_tasklist_mem_usage(row[4]),
			}
		)

	records.sort(key=lambda item: item["mem_usage_bytes"], reverse=True)
	return records[:limit]


def extract_ram_snapshot(output_path: str, evidence_path: str | None = None) -> str:
	"""Captures a point-in-time RAM snapshot with optional evidence file context."""
	log_info("Capturing system RAM snapshot...")

	evidence_context = None
	if evidence_path:
		evidence_abs_path = os.path.abspath(evidence_path)
		evidence_context = {
			"evidence_path": evidence_abs_path,
			"exists": os.path.exists(evidence_abs_path),
			"file_size_bytes": os.path.getsize(evidence_abs_path) if os.path.exists(evidence_abs_path) else None,
		}

	payload = {
		"artifact_type": "ram_snapshot",
		"captured_at": datetime.now(timezone.utc).isoformat(),
		"system_memory": _collect_system_memory(),
		"top_processes": _collect_top_processes(limit=10),
		"evidence_context": evidence_context,
	}

	return save_json(output_path, payload)
