# VIGIL-AXIS Architecture

- **Web Context**: Flask app processes REST operations, frontend handles UI state using React context/Zustand.
- **Triage Context**: Execution happens locally on victim/suspect machines. Logs result over HTTPS (with cert validation).
- **Blockchain Context**: Smart contract acts as a WORM (Write Once Read Many) data store for critical logs.
