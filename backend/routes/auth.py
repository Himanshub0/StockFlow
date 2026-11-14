from flask import Blueprint, request, current_app
from backend.services.auth_service import AuthService
from backend.utils.responses import success_response, error_response
from backend.utils.auth import require_auth

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

def get_target_db():
    return current_app.config.get("DATABASE_PATH")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")
    role = data.get("role", "shopkeeper")
    ip_address = request.remote_addr or "127.0.0.1"

    try:
        user, token = AuthService.register(
            username=username,
            email=email,
            password=password,
            full_name=full_name,
            role=role,
            ip_address=ip_address,
            db_path=get_target_db()
        )
        return success_response(
            data={"user": user, "token": token},
            message="User account created successfully",
            status_code=201
        )
    except PermissionError as e:
        return error_response(str(e), status_code=403)
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Registration failed: {str(e)}", status_code=500)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = data.get("identifier") or data.get("email") or data.get("username")
    password = data.get("password")
    ip_address = request.remote_addr or "127.0.0.1"

    try:
        user, token = AuthService.login(
            identifier=identifier,
            password=password,
            ip_address=ip_address,
            db_path=get_target_db()
        )
        return success_response(
            data={"user": user, "token": token},
            message="Authenticated successfully",
            status_code=200
        )
    except PermissionError as e:
        return error_response(str(e), status_code=403)
    except ValueError as e:
        return error_response(str(e), status_code=401)
    except Exception as e:
        return error_response(f"Authentication error: {str(e)}", status_code=500)

@auth_bp.route("/me", methods=["GET"])
def me():
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif "X-Auth-Token" in request.headers:
        token = request.headers["X-Auth-Token"].strip()
    
    if not token:
        return error_response("Missing authorization token", status_code=401)

    user = AuthService.get_user_from_token(token, db_path=get_target_db())
    if not user:
        return error_response("Invalid or expired session token", status_code=401)

    return success_response(data={"user": user}, message="User profile retrieved")

@auth_bp.route("/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    
    if token:
        AuthService.logout(token, db_path=get_target_db())

    return success_response(data={"logged_out": True}, message="Successfully signed out")


@auth_bp.route("/profile", methods=["PATCH"])
@require_auth()
def update_profile():
    data = request.get_json(silent=True) or {}
    actor = getattr(request, "current_user", {})
    full_name = data.get("full_name")
    try:
        user = AuthService.update_profile(
            actor["id"],
            full_name=full_name,
            ip_address=request.remote_addr or "127.0.0.1",
            db_path=get_target_db(),
        )
        return success_response(data={"user": user}, message="Profile updated successfully")
    except ValueError as e:
        return error_response(str(e), status_code=400, errors={"full_name": str(e)})
    except Exception as e:
        return error_response(f"Failed to update profile: {str(e)}", status_code=500)


@auth_bp.route("/change-password", methods=["POST"])
@require_auth()
def change_password():
    data = request.get_json(silent=True) or {}
    actor = getattr(request, "current_user", {})
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    try:
        AuthService.change_password(
            actor["id"],
            current_password=current_password,
            new_password=new_password,
            ip_address=request.remote_addr or "127.0.0.1",
            db_path=get_target_db(),
        )
        return success_response(data={"updated": True}, message="Password changed successfully")
    except PermissionError as e:
        return error_response(str(e), status_code=403, errors={"current_password": str(e)})
    except ValueError as e:
        msg = str(e)
        err_key = "current_password" if "current" in msg.lower() else "new_password"
        return error_response(msg, status_code=400, errors={err_key: msg})
    except Exception as e:
        return error_response(f"Failed to change password: {str(e)}", status_code=500)
