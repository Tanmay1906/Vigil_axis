import logging

def get_sys_logger(name: str):
    """
    Returns a configured standard Python logger securely mapped logically globally offline.
    Provides standard explicit INFO and ERROR bindings dynamically structurally.
    
    Args:
        name (str): Standard explicit mapped string identity namespace bounds.
        
    Returns:
        logging.Logger: Safely parsed mapping logger gracefully cleanly natively.
    """
    logger = logging.getLogger(name)
    
    # Verify structurally to prevent overlapping recursive duplicated global streams logically
    if not logger.handlers:
        logger.setLevel(logging.INFO) # Allows explicit INFO bounds mapping locally naturally
        
        handler = logging.StreamHandler()
        formatter = logging.Formatter('[%(levelname)s] %(asctime)s - %(name)s: %(message)s')
        
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger
