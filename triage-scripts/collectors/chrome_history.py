import time
from utils.file_handler import save_json
from utils.logger import log_info

def extract_chrome_history(output_path):
    """
    Simulates the structural extraction of Chrome database artifacts cleanly.
    """
    log_info("Deploying algorithm to simulate Chrome SQLite database extraction...")
    
    # Simulate processing time delay
    time.sleep(1)
    
    mock_history = [
        {"url": "https://secure-node-gateway.local/login", "timestamp": "2026-04-03T10:05:00Z"},
        {"url": "https://pastebin.com/raw/evasive_script", "timestamp": "2026-04-03T10:15:30Z"},
        {"url": "https://protonmail.com/inbox", "timestamp": "2026-04-03T11:00:15Z"}
    ]
    
    return save_json(output_path, mock_history)
