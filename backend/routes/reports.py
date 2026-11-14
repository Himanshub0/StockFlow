from flask import Blueprint, request, current_app
from backend.services.report_service import ReportService
from backend.utils.responses import success_response, error_response
from backend.utils.auth import require_auth

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

def get_target_db():
    return current_app.config.get("DATABASE_PATH")

@reports_bp.route("/summary", methods=["GET"])
@require_auth()
def summary():
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        category = request.args.get("category")
        data = ReportService.get_summary(
            get_target_db(),
            start_date=start_date,
            end_date=end_date,
            category=category,
        )
        return success_response(data=data)
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Failed to generate report summary: {str(e)}", status_code=500)
