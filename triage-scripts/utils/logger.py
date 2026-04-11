from datetime import datetime, timezone

def log_info(message):
    timestamp = datetime.now(timezone.utc).isoformat()
    print(f"[INFO] [{timestamp}] {message}")

def log_error(message):
    timestamp = datetime.now(timezone.utc).isoformat()
    print(f"[ERROR] [{timestamp}] {message}")
