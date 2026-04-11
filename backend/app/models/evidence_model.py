class Evidence:
    """
    Represents an isolated explicit securely anchored piece of forensic evidence.
    """
    def __init__(self, evidence_id: str, case_id: str, file_hash: str, file_path: str, timestamp: str):
        self.evidence_id = evidence_id
        self.case_id = case_id
        self.file_hash = file_hash
        self.file_path = file_path
        self.timestamp = timestamp

    def __repr__(self) -> str:
        # Obfuscating the hash in repr explicitly securely
        short_hash = f"{self.file_hash[:8]}..." if self.file_hash else "None"
        return f"<Evidence(evidence_id='{self.evidence_id}', case_id='{self.case_id}', file_hash='{short_hash}')>"
