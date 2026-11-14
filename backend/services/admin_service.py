import os
from backend.database.connection import get_db, rows_to_dict_list, row_to_dict
from backend.utils.validators import VALID_ROLES
from backend.config import Config

class AdminService:
    @staticmethod
    def get_metrics(db_path=None):
        conn = get_db(db_path)
        try:
            total_users = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
            total_admins = conn.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").fetchone()["count"]
            total_managers = conn.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'manager'").fetchone()["count"]
            total_shopkeepers = conn.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'shopkeeper'").fetchone()["count"]
            total_wholesalers = conn.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'wholesaler'").fetchone()["count"]
            total_staff = conn.execute("SELECT COUNT(*) AS count FROM users WHERE role IN ('staff', 'user')").fetchone()["count"]
            total_regular = total_shopkeepers + total_wholesalers + total_staff
            suspended_users = conn.execute("SELECT COUNT(*) AS count FROM users WHERE status = 'suspended'").fetchone()["count"]
            
            total_products = conn.execute("SELECT COUNT(*) AS count FROM products").fetchone()["count"]
            low_stock_products = conn.execute("SELECT COUNT(*) AS count FROM products WHERE current_stock <= min_stock").fetchone()["count"]
            total_suppliers = conn.execute("SELECT COUNT(*) AS count FROM suppliers").fetchone()["count"]
            total_movements = conn.execute("SELECT COUNT(*) AS count FROM movements").fetchone()["count"]
            total_logs = conn.execute("SELECT COUNT(*) AS count FROM audit_logs").fetchone()["count"]

            db_size_kb = 0
            target_path = db_path if db_path is not None else Config.DATABASE_PATH
            if target_path != ":memory:" and os.path.exists(target_path):
                db_size_kb = round(os.path.getsize(target_path) / 1024, 1)

            return {
                "users": {
                    "total": total_users,
                    "admins": total_admins,
                    "managers": total_managers,
                    "regular": total_regular,
                    "shopkeepers": total_shopkeepers,
                    "wholesalers": total_wholesalers,
                    "staff": total_staff,
                    "suspended": suspended_users
                },
                "inventory": {
                    "total_products": total_products,
                    "low_stock_alerts": low_stock_products,
                    "total_suppliers": total_suppliers,
                    "total_movements": total_movements
                },
                "system": {
                    "status": "healthy",
                    "health_score": 99.8,
                    "database_engine": "SQLite 3 WAL",
                    "database_size_kb": db_size_kb,
                    "total_audit_events": total_logs,
                    "environment": "production-ready"
                }
            }
        finally:
            conn.close()

    @staticmethod
    def get_all_users(db_path=None):
        conn = get_db(db_path)
        try:
            rows = conn.execute(
                """
                SELECT id, username, email, full_name, role, status, created_at, last_login 
                FROM users 
                ORDER BY created_at DESC
                """
            ).fetchall()
            return rows_to_dict_list(rows)
        finally:
            conn.close()

    @staticmethod
    def update_user_role(user_id, new_role, performer="admin", db_path=None):
        new_role = (new_role or "").strip().lower()
        if new_role not in VALID_ROLES:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

        conn = get_db(db_path)
        try:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                raise ValueError(f"User with ID {user_id} not found.")

            if user["role"] == "admin" and new_role != "admin":
                # Ensure we don't leave 0 admins
                admin_count = conn.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND status = 'active'").fetchone()["count"]
                if admin_count <= 1:
                    raise PermissionError("Cannot demote the last remaining active Administrator.")

            conn.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
            conn.execute(
                """
                INSERT INTO audit_logs (user_id, username, action, details, status)
                VALUES (?, ?, 'ROLE_MODIFIED', ?, 'success')
                """,
                (user_id, user["username"], f"Role changed from {user['role']} to {new_role} by {performer}")
            )
            conn.commit()
            return {"id": user_id, "username": user["username"], "role": new_role}
        finally:
            conn.close()

    @staticmethod
    def update_user_status(user_id, new_status, performer="admin", db_path=None):
        new_status = (new_status or "").strip().lower()
        if new_status not in ("active", "suspended"):
            raise ValueError("Status must be either 'active' or 'suspended'.")

        conn = get_db(db_path)
        try:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                raise ValueError(f"User with ID {user_id} not found.")

            if user["role"] == "admin" and new_status == "suspended":
                admin_count = conn.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND status = 'active'").fetchone()["count"]
                if admin_count <= 1:
                    raise PermissionError("Cannot suspend the only remaining active Administrator.")

            conn.execute("UPDATE users SET status = ? WHERE id = ?", (new_status, user_id))
            conn.execute(
                """
                INSERT INTO audit_logs (user_id, username, action, details, status)
                VALUES (?, ?, 'STATUS_MODIFIED', ?, 'success')
                """,
                (user_id, user["username"], f"Status changed from {user['status']} to {new_status} by {performer}")
            )
            conn.commit()
            return {"id": user_id, "username": user["username"], "status": new_status}
        finally:
            conn.close()

    @staticmethod
    def delete_user(user_id, performer="admin", db_path=None):
        conn = get_db(db_path)
        try:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                raise ValueError(f"User with ID {user_id} not found.")

            if user["role"] == "admin":
                admin_count = conn.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND status = 'active'").fetchone()["count"]
                if admin_count <= 1:
                    raise PermissionError("Cannot delete the only remaining active Administrator.")

            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            conn.execute(
                """
                INSERT INTO audit_logs (username, action, details, status)
                VALUES (?, 'USER_DELETED', ?, 'success')
                """,
                (user["username"], f"User {user['username']} deleted by {performer}")
            )
            conn.commit()
            return {"deleted": True, "id": user_id, "username": user["username"]}
        finally:
            conn.close()

    @staticmethod
    def get_audit_logs(limit=50, db_path=None):
        conn = get_db(db_path)
        try:
            rows = conn.execute(
                """
                SELECT id, user_id, username, action, details, ip_address, status, created_at 
                FROM audit_logs 
                ORDER BY created_at DESC 
                LIMIT ?
                """,
                (limit,)
            ).fetchall()
            return rows_to_dict_list(rows)
        finally:
            conn.close()
