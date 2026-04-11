import os
import uuid
from werkzeug.utils import secure_filename
from ..utils.logger import get_sys_logger

logger = get_sys_logger(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')

def save_file(uploaded_file) -> str:
    """
    Extracts the HTTP stream payload, safely saving its physical stream bounds
    into the localized generic uploads directory. Collisions are mapped dynamically.
    
    Args:
        uploaded_file: The HTTP multipart file stream.
        
    Returns:
        str: Absolute explicit safe path string.
    """
    if not os.path.exists(UPLOAD_FOLDER):
        logger.info(f"Creating missing uploads directory: {UPLOAD_FOLDER}")
        os.makedirs(UPLOAD_FOLDER)
        
    filename = secure_filename(uploaded_file.filename)
    if not filename:
        filename = "unnamed_artifact"
        
    unique_prefix = uuid.uuid4().hex[:8]
    unique_name = f"{unique_prefix}_{filename}"
    filepath = os.path.join(UPLOAD_FOLDER, unique_name)
    
    try:
        uploaded_file.save(filepath)
        logger.info(f"File physical safely stored mapping successfully at: {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Failed securely saving bound stream mapping: {str(e)}")
        raise e
