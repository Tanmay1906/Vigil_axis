class AuditLog:
    """
    Represents immutable explicit actions securely logged representing system modifications securely tracking behavior globally safely.
    """
    def __init__(self, log_id: str, action: str, actor: str, target_id: str, timestamp: str):
        self.log_id = log_id
        self.action = action
        self.actor = actor
        self.target_id = target_id
        self.timestamp = timestamp

    def __repr__(self) -> str:
        return f"<AuditLog(action='{self.action}', actor='{self.actor}', target_id='{self.target_id}', timestamp='{self.timestamp}')>"
