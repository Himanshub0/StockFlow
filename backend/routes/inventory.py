from flask import Blueprint, request, current_app
from backend.database.connection import get_db
from backend.services.inventory_service import InventoryService
from backend.utils.responses import success_response, error_response
from backend.utils.auth import require_auth

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")

TECHNICAL_SETTING_KEYS = {"cluster_region", "backup_schedule"}
VALID_BACKUP_SCHEDULES = {"daily_2200_close", "hourly", "weekly_sunday", "manual_only"}

def get_target_db():
    return current_app.config.get("DATABASE_PATH")

@inventory_bp.route("/overview", methods=["GET"])
@require_auth()
def overview():
    try:
        data = InventoryService.get_overview(get_target_db())
        return success_response(data=data)
    except Exception as e:
        return error_response(f"Failed to fetch overview: {str(e)}", status_code=500)

@inventory_bp.route("/alerts", methods=["GET"])
@require_auth()
def alerts():
    try:
        data = InventoryService.get_alerts(get_target_db())
        return success_response(data={"alerts": data})
    except Exception as e:
        return error_response(f"Failed to fetch alerts: {str(e)}", status_code=500)

@inventory_bp.route("/store-data", methods=["DELETE"])
@require_auth(roles=["admin", "manager", "shopkeeper"])
def reset_store_data():
    conn = get_db(get_target_db())
    try:
        conn.execute("BEGIN IMMEDIATE")
        counts = {}
        for table in ("products", "suppliers", "movements", "purchase_orders", "sales_orders"):
            counts[table] = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in ("sales_order_items", "purchase_order_items", "movements", "sales_orders", "purchase_orders", "products", "suppliers"):
            conn.execute(f"DELETE FROM {table}")
        actor = getattr(request, "current_user", {}) or {}
        conn.execute(
            "INSERT INTO audit_logs (username, action, details, status) VALUES (?, 'STORE_DATA_RESET', ?, 'success')",
            (actor.get("username", "system"), "Deleted store inventory, supplier, movement, purchase-order, and sales-order data"),
        )
        conn.commit()
        return success_response(data={"deleted": counts}, message="Store data reset successfully")
    except Exception as e:
        conn.rollback()
        return error_response(f"Failed to reset store data: {str(e)}", status_code=500)
    finally:
        conn.close()
def _filter_settings_for_role(settings_dict, role):
    if (role or "").lower() == "admin":
        return settings_dict
    return {k: v for k, v in settings_dict.items() if k not in TECHNICAL_SETTING_KEYS}

@inventory_bp.route("/settings", methods=["GET"])
@require_auth()
def get_settings():
    actor = getattr(request, "current_user", {}) or {}
    conn = get_db(get_target_db())
    try:
        rows = conn.execute("SELECT key, value FROM system_settings WHERE key != 'currency'").fetchall()
        settings_dict = _filter_settings_for_role({r["key"]: r["value"] for r in rows}, actor.get("role"))
        settings_dict["currency"] = "INR"
        return success_response(data={"settings": settings_dict})
    finally:
        conn.close()

@inventory_bp.route("/settings", methods=["PUT", "POST"])
@require_auth(roles=["admin", "manager", "shopkeeper"])
def update_settings():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict) or not data:
        return error_response("Settings payload is required", status_code=400)

    actor = getattr(request, "current_user", {}) or {}
    actor_role = (actor.get("role") or "").lower()

    if actor_role != "admin" and any(k in TECHNICAL_SETTING_KEYS for k in data):
        return error_response("Only administrators can modify technical system settings", status_code=403)

    field_errors = {}
    cleaned = {}

    for k, raw_val in data.items():
        if k == "company_name":
            val = str(raw_val or "").strip()
            if not val:
                field_errors[k] = "Store name cannot be empty"
            else:
                cleaned[k] = val
        elif k == "currency":
            val = str(raw_val or "").strip().upper()
            if val == "INR":
                cleaned[k] = val
            else:
                field_errors[k] = "Only INR (Indian rupee) is supported"
        elif k == "default_low_stock_threshold":
            try:
                num = int(str(raw_val).strip())
                if num < 0:
                    raise ValueError
                cleaned[k] = str(num)
            except (ValueError, TypeError):
                field_errors[k] = "Low stock threshold must be a non-negative whole number"
        elif k == "items_per_page":
            try:
                num = int(str(raw_val).strip())
                if num < 5 or num > 100:
                    raise ValueError
                cleaned[k] = str(num)
            except (ValueError, TypeError):
                field_errors[k] = "Items per page must be a whole number between 5 and 100"
        elif k == "enable_realtime_alerts":
            if isinstance(raw_val, bool):
                cleaned[k] = "true" if raw_val else "false"
            else:
                txt = str(raw_val or "").strip().lower()
                if txt not in ("true", "false"):
                    field_errors[k] = "Real-time alerts setting must be true or false"
                else:
                    cleaned[k] = txt
        elif k == "cluster_region":
            val = str(raw_val or "").strip()
            if not val:
                field_errors[k] = "Cluster region cannot be empty"
            else:
                cleaned[k] = val
        elif k == "backup_schedule":
            val = str(raw_val or "").strip()
            if val not in VALID_BACKUP_SCHEDULES:
                field_errors[k] = f"Backup schedule must be one of: {', '.join(sorted(VALID_BACKUP_SCHEDULES))}"
            else:
                cleaned[k] = val
        else:
            cleaned[k] = str(raw_val if raw_val is not None else "").strip()

    if field_errors:
        first_err = next(iter(field_errors.values()))
        return error_response(first_err, status_code=400, errors=field_errors)

    conn = get_db(get_target_db())
    try:
        for k, v in cleaned.items():
            conn.execute(
                """
                INSERT INTO system_settings (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
                """,
                (k, v)
            )
        conn.commit()
        rows = conn.execute("SELECT key, value FROM system_settings WHERE key != 'currency'").fetchall()
        settings_dict = _filter_settings_for_role({r["key"]: r["value"] for r in rows}, actor_role)
        settings_dict["currency"] = "INR"
        return success_response(data={"settings": settings_dict}, message="System settings updated successfully")
    finally:
        conn.close()
