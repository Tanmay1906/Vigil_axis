class Case:
    """
    Represents a structured forensic case wrapping multiple bounds logically offline.
    """
    def __init__(self, case_id: str, investigator: str, timestamp: str, status: str = "OPEN"):
        self.case_id = case_id
        self.investigator = investigator
        self.timestamp = timestamp
        self.status = status
        # Explicitly tracking bounds dynamically locally
        self.evidence_ids = []

    def __repr__(self) -> str:
        return f"<Case(case_id='{self.case_id}', status='{self.status}', investigator='{self.investigator}')>"
