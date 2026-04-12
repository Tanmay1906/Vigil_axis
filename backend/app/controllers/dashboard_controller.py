from flask import jsonify

from app.services.hash_index_service import get_dashboard_stats, list_ledger_entries


def dashboard_stats():
    try:
        stats = get_dashboard_stats()
        return jsonify({"status": "success", "stats": stats}), 200
    except Exception as exc:
        return jsonify({"error": f"Server Error: {str(exc)}"}), 500


def ledger_feed():
    try:
        entries = list_ledger_entries(limit=200)
        return jsonify({"status": "success", "entries": entries}), 200
    except Exception as exc:
        return jsonify({"error": f"Server Error: {str(exc)}"}), 500
