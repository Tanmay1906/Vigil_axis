import os
import json
from .logger import log_info, log_error

def save_json(filepath, data):
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        log_info(f"Saved payload safely to {filepath}")
        return filepath
    except Exception as e:
        log_error(f"Failed to process file operation: {str(e)}")
        raise e
