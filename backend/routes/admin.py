from flask import Blueprint, request, current_app
from backend.services.admin_service import AdminService
from backend.services.auth_service import AuthService
from backend.utils.responses import success_response, error_response

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

def get_target_db():
    return current_app.config.get("DATABASE_PATH")

def get_current_actor():
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif "X-Auth-Token" in request.headers:
        token = request.headers["X-Auth-Token"].strip()

    if token:
        user = AuthService.get_user_from_token(token, db_path=get_target_db())
        if user:
            return user
    return None

@admin_bp.before_request
def enforce_admin_access():
    if request.method == "OPTIONS":
        return None
    actor = get_current_actor()
    if not actor:
        return error_response("Authentication required", status_code=401)
    if actor.get("role") != "admin":
        return error_response("Administrator clearance required", status_code=403)
    request.current_actor = actor

@admin_bp.route("/metrics", methods=["GET"])
def metrics():
    try:
        data = AdminService.get_metrics(db_path=get_target_db())
        return success_response(data=data, message="Admin telemetry loaded")
    except Exception as e:
        return error_response(f"Failed to fetch metrics: {str(e)}", status_code=500)

@admin_bp.route("/users", methods=["GET"])
def list_users():
    try:
        users = AdminService.get_all_users(db_path=get_target_db())
        return success_response(data={"users": users}, message="User directory retrieved")
    except Exception as e:
        return error_response(f"Failed to load users: {str(e)}", status_code=500)

@admin_bp.route("/users", methods=["POST"])
def create_user():
    data = request.get_json(silent=True) or {}
    actor = get_current_actor()
    try:
        user, _ = AuthService.register(
            username=data.get("username"),
            email=data.get("email"),
            password=data.get("password") or "stockflow123",
            full_name=data.get("full_name"),
            role=data.get("role", "user"),
            ip_address=request.remote_addr or "127.0.0.1",
            db_path=get_target_db(),
            allow_privileged=True,
        )
        return success_response(data={"user": user}, message=f"User {user['username']} created", status_code=201)
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Failed to create user: {str(e)}", status_code=500)

@admin_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
def update_role(user_id):
    data = request.get_json(silent=True) or {}
    new_role = data.get("role")
    actor = get_current_actor()
    try:
        res = AdminService.update_user_role(user_id, new_role, performer=actor.get("username", "admin"), db_path=get_target_db())
        return success_response(data=res, message=f"User role updated to {new_role}")
    except PermissionError as e:
        return error_response(str(e), status_code=403)
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Failed to update role: {str(e)}", status_code=500)

@admin_bp.route("/users/<int:user_id>/status", methods=["PATCH"])
def update_status(user_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    actor = get_current_actor()
    try:
        res = AdminService.update_user_status(user_id, new_status, performer=actor.get("username", "admin"), db_path=get_target_db())
        return success_response(data=res, message=f"User status updated to {new_status}")
    except PermissionError as e:
        return error_response(str(e), status_code=403)
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Failed to update status: {str(e)}", status_code=500)

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    actor = get_current_actor()
    try:
        res = AdminService.delete_user(user_id, performer=actor.get("username", "admin"), db_path=get_target_db())
        return success_response(data=res, message="User deleted successfully")
    except PermissionError as e:
        return error_response(str(e), status_code=403)
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Failed to delete user: {str(e)}", status_code=500)

@admin_bp.route("/audit-logs", methods=["GET"])
def audit_logs():
    limit = request.args.get("limit", default=50, type=int)
    try:
        logs = AdminService.get_audit_logs(limit=limit, db_path=get_target_db())
        return success_response(data={"logs": logs}, message="Audit logs retrieved")
    except Exception as e:
        return error_response(f"Failed to fetch audit logs: {str(e)}", status_code=500)
