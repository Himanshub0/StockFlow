from functools import wraps
from flask import request, current_app
from backend.services.auth_service import AuthService
from backend.utils.responses import error_response

def get_target_db():
    return current_app.config.get("DATABASE_PATH")

def get_current_actor():
    """
    Extracts the session token from Authorization: Bearer <token> or X-Auth-Token: <token>
    and validates it against the active session store (memory & SQLite).
    Returns (user_dict, error_msg, status_code).
    """
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif "X-Auth-Token" in request.headers:
        token = request.headers["X-Auth-Token"].strip()

    if not token:
        return None, "Authentication required", 401

    user = AuthService.get_user_from_token(token, db_path=get_target_db())
    if not user:
        return None, "Session expired or invalid", 401

    if user.get("status") == "suspended":
        return None, "Account is suspended", 403

    return user, None, 200

def require_auth(roles=None):
    """
    Decorator that enforces authentication and optional role-based access control (RBAC).
    Usage:
        @require_auth()
        @require_auth(roles=["admin", "manager"])
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if request.method == "OPTIONS":
                return fn(*args, **kwargs)

            user, err_msg, status_code = get_current_actor()
            if not user:
                return error_response(err_msg, status_code=status_code)

            if roles is not None:
                user_role = (user.get("role") or "").lower()
                allowed = [r.lower() for r in roles]
                if user_role not in allowed:
                    return error_response("Insufficient permissions for this operation", status_code=403)

            request.current_user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator
