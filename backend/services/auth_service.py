import secrets
from datetime import datetime, timedelta
from backend.database.connection import get_db, row_to_dict
from backend.utils.validators import is_valid_email, is_valid_password, hash_password, verify_password, VALID_ROLES

# Active in-memory session tokens store (token -> {user_id, username, role, expires_at})
_ACTIVE_SESSIONS = {}
SESSION_DURATION_HOURS = 24

class AuthService:
    @staticmethod
    def register(username, email, password, full_name, role="shopkeeper", ip_address="127.0.0.1", db_path=None, allow_privileged=False):
        username = (username or "").strip()
        email = (email or "").strip().lower()
        full_name = (full_name or "").strip()
        role = (role or "shopkeeper").strip().lower()

        if not username or len(username) < 3:
            raise ValueError("Username must be at least 3 characters long.")

        if not is_valid_email(email):
            raise ValueError("Invalid email format.")

        valid_pw, pw_err = is_valid_password(password)
        if not valid_pw:
            raise ValueError(pw_err)

        if not full_name:
            full_name = username

        if role not in VALID_ROLES:
            raise ValueError(f"Invalid role '{role}'. Allowed roles: {', '.join(sorted(VALID_ROLES))}")

        if not allow_privileged and role in ("admin", "manager"):
            raise PermissionError("Administrator and Manager accounts cannot be self-registered. Please contact an administrator.")

        conn = get_db(db_path)
        try:
            # Check existing
            existing = conn.execute(
                "SELECT id, username, email FROM users WHERE username = ? OR email = ?",
                (username, email)
            ).fetchone()
            if existing:
                if existing["username"].lower() == username.lower():
                    raise ValueError(f"Username '{username}' is already taken.")
                if existing["email"].lower() == email.lower():
                    raise ValueError(f"Email '{email}' is already registered.")

            pwd_hash = hash_password(password)
            cur = conn.execute(
                """
                INSERT INTO users (username, email, password_hash, full_name, role, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
                """,
                (username, email, pwd_hash, full_name, role)
            )
            user_id = cur.lastrowid

            # Log audit
            conn.execute(
                """
                INSERT INTO audit_logs (user_id, username, action, details, ip_address, status)
                VALUES (?, ?, 'USER_REGISTERED', ?, ?, 'success')
                """,
                (user_id, username, f"New user created with role '{role}'", ip_address)
            )
            conn.commit()

            # Create session with expiration
            token = secrets.token_hex(24)
            expires_at = datetime.now() + timedelta(hours=SESSION_DURATION_HOURS)
            expires_at_iso = expires_at.isoformat()

            conn.execute(
                """
                INSERT INTO user_sessions (token, user_id, expires_at)
                VALUES (?, ?, ?)
                """,
                (token, user_id, expires_at_iso)
            )
            conn.commit()

            _ACTIVE_SESSIONS[token] = {
                "user_id": user_id,
                "username": username,
                "role": role,
                "expires_at": expires_at_iso
            }

            user_data = {
                "id": user_id,
                "username": username,
                "email": email,
                "full_name": full_name,
                "role": role,
                "status": "active"
            }
            return user_data, token
        finally:
            conn.close()

    @staticmethod
    def login(identifier, password, ip_address="127.0.0.1", db_path=None):
        identifier = (identifier or "").strip().lower()
        if not identifier or not password:
            raise ValueError("Email/username and password are required.")

        conn = get_db(db_path)
        try:
            row = conn.execute(
                "SELECT * FROM users WHERE email = ? OR username = ?",
                (identifier, identifier)
            ).fetchone()

            if not row:
                # Log failed attempt
                conn.execute(
                    """
                    INSERT INTO audit_logs (username, action, details, ip_address, status)
                    VALUES (?, 'LOGIN_FAILED', 'Account not found', ?, 'failed')
                    """,
                    (identifier, ip_address)
                )
                conn.commit()
                raise ValueError("Invalid credentials.")

            user = row_to_dict(row)
            if user["status"] == "suspended":
                conn.execute(
                    """
                    INSERT INTO audit_logs (user_id, username, action, details, ip_address, status)
                    VALUES (?, ?, 'LOGIN_BLOCKED', 'Account suspended', ?, 'failed')
                    """,
                    (user["id"], user["username"], ip_address)
                )
                conn.commit()
                raise PermissionError("Your account has been suspended. Please contact system administrator.")

            if not verify_password(user["password_hash"], password):
                conn.execute(
                    """
                    INSERT INTO audit_logs (user_id, username, action, details, ip_address, status)
                    VALUES (?, ?, 'LOGIN_FAILED', 'Incorrect password', ?, 'failed')
                    """,
                    (user["id"], user["username"], ip_address)
                )
                conn.commit()
                raise ValueError("Invalid credentials.")

            # Update last login
            conn.execute(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
                (user["id"],)
            )
            conn.execute(
                """
                INSERT INTO audit_logs (user_id, username, action, details, ip_address, status)
                VALUES (?, ?, 'LOGIN_SUCCESS', 'Successful authentication', ?, 'success')
                """,
                (user["id"], user["username"], ip_address)
            )
            conn.commit()

            token = secrets.token_hex(24)
            expires_at = datetime.now() + timedelta(hours=SESSION_DURATION_HOURS)
            expires_at_iso = expires_at.isoformat()

            conn.execute(
                """
                INSERT INTO user_sessions (token, user_id, expires_at)
                VALUES (?, ?, ?)
                """,
                (token, user["id"], expires_at_iso)
            )
            conn.commit()

            _ACTIVE_SESSIONS[token] = {
                "user_id": user["id"],
                "username": user["username"],
                "role": user["role"],
                "expires_at": expires_at_iso
            }

            safe_user = {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"],
                "status": user["status"],
                "last_login": datetime.now().isoformat()
            }
            return safe_user, token
        finally:
            conn.close()

    @staticmethod
    def get_user_from_token(token, db_path=None):
        if not token:
            return None

        # Check memory cache first
        session = _ACTIVE_SESSIONS.get(token)
        if session:
            try:
                exp = datetime.fromisoformat(session.get("expires_at", ""))
                if exp <= datetime.now():
                    del _ACTIVE_SESSIONS[token]
                    session = None
            except Exception:
                session = None

        conn = get_db(db_path)
        try:
            if not session:
                # Fallback to persistent SQLite session table
                row = conn.execute(
                    """
                    SELECT s.token, s.user_id, s.expires_at, u.username, u.role
                    FROM user_sessions s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.token = ?
                    """,
                    (token,)
                ).fetchone()

                if not row:
                    return None

                try:
                    exp = datetime.fromisoformat(row["expires_at"])
                    if exp <= datetime.now():
                        conn.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
                        conn.commit()
                        return None
                except Exception:
                    return None

                session = {
                    "user_id": row["user_id"],
                    "username": row["username"],
                    "role": row["role"],
                    "expires_at": row["expires_at"]
                }
                _ACTIVE_SESSIONS[token] = session

            user_row = conn.execute(
                "SELECT id, username, email, full_name, role, status, created_at, last_login FROM users WHERE id = ?",
                (session["user_id"],)
            ).fetchone()

            if not user_row or user_row["status"] == "suspended":
                return None

            return row_to_dict(user_row)
        finally:
            conn.close()

    @staticmethod
    def logout(token, db_path=None):
        if not token:
            return False
        if token in _ACTIVE_SESSIONS:
            del _ACTIVE_SESSIONS[token]

        conn = get_db(db_path)
        try:
            cur = conn.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def update_profile(user_id, full_name, ip_address="127.0.0.1", db_path=None):
        full_name = (full_name or "").strip()
        if not full_name or len(full_name) < 2:
            raise ValueError("Full name must be at least 2 characters long.")

        conn = get_db(db_path)
        try:
            row = conn.execute("SELECT id, username FROM users WHERE id = ?", (user_id,)).fetchone()
            if not row:
                raise ValueError("User not found.")
            conn.execute("UPDATE users SET full_name = ? WHERE id = ?", (full_name, user_id))
            conn.execute(
                """
                INSERT INTO audit_logs (user_id, username, action, details, ip_address, status)
                VALUES (?, ?, 'PROFILE_UPDATED', ?, ?, 'success')
                """,
                (user_id, row["username"], "Updated display profile name", ip_address),
            )
            conn.commit()
            updated = conn.execute(
                "SELECT id, username, email, full_name, role, status, created_at, last_login FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
            return row_to_dict(updated)
        finally:
            conn.close()

    @staticmethod
    def change_password(user_id, current_password, new_password, ip_address="127.0.0.1", db_path=None):
        if not current_password:
            raise ValueError("Current password is required.")
        valid_pw, pw_err = is_valid_password(new_password)
        if not valid_pw:
            raise ValueError(pw_err)
        if current_password == new_password:
            raise ValueError("New password must differ from your current password.")

        conn = get_db(db_path)
        try:
            row = conn.execute("SELECT id, username, password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
            if not row:
                raise ValueError("User not found.")
            if not verify_password(row["password_hash"], current_password):
                conn.execute(
                    """
                    INSERT INTO audit_logs (user_id, username, action, details, ip_address, status)
                    VALUES (?, ?, 'PASSWORD_CHANGE_FAILED', 'Incorrect current password', ?, 'failed')
                    """,
                    (user_id, row["username"], ip_address),
                )
                conn.commit()
                raise PermissionError("Current password is incorrect.")
            new_hash = hash_password(new_password)
            conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
            conn.execute(
                """
                INSERT INTO audit_logs (user_id, username, action, details, ip_address, status)
                VALUES (?, ?, 'PASSWORD_CHANGED', 'User updated account password', ?, 'success')
                """,
                (user_id, row["username"], ip_address),
            )
            conn.commit()
            return True
        finally:
            conn.close()
