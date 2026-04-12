from flask import Blueprint

from app.controllers.dashboard_controller import dashboard_stats, ledger_feed

dashboard_bp = Blueprint("dashboard_bp", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
def handle_stats():
    return dashboard_stats()


@dashboard_bp.route("/ledger", methods=["GET"])
def handle_ledger():
    return ledger_feed()
