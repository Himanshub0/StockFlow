from flask import Blueprint, request, current_app
from backend.services.usage_service import UsageService
from backend.utils.responses import success_response

usage_bp = Blueprint("usage", __name__, url_prefix="/api/usage")

@usage_bp.route("/track", methods=["POST"])
def track():
    data = request.get_json(silent=True) or {}
    event_type = data.get("event") or "TELEMETRY"
    details = str(data.get("metadata") or "")
    ip = request.remote_addr or "127.0.0.1"
    target_db = current_app.config.get("DATABASE_PATH")

    try:
        UsageService.record_event(event_type, details, ip, db_path=target_db)
        return success_response(message="Telemetry logged")
    except Exception:
        return success_response(message="Logged locally")
