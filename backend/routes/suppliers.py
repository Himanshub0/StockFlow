from flask import Blueprint, request, current_app
from backend.database.connection import get_db, rows_to_dict_list, row_to_dict
from backend.services.supplier_service import SupplierService
from backend.services.csv_import_service import CsvImportService, handle_csv_import_route
from backend.utils.responses import success_response, error_response
from backend.utils.auth import require_auth
from backend.utils.validators import is_valid_email

suppliers_bp = Blueprint("suppliers", __name__, url_prefix="/api/suppliers")

def get_target_db():
    return current_app.config.get("DATABASE_PATH")

@suppliers_bp.route("", methods=["GET"])
@require_auth()
def get_suppliers():
    conn = get_db(get_target_db())
    try:
        tier = request.args.get("tier")
        status = request.args.get("status")
        search = (request.args.get("search") or "").strip().lower()

        query = """
            SELECT s.*, COUNT(p.id) as products_count
            FROM suppliers s
            LEFT JOIN products p ON s.id = p.supplier_id
            WHERE 1=1
        """
        params = []
        if tier and tier != "all":
            query += " AND s.tier = ?"
            params.append(tier)
        if status and status != "all":
            query += " AND s.status = ?"
            params.append(status)
        if search:
            query += " AND (LOWER(s.name) LIKE ? OR LOWER(s.code) LIKE ? OR LOWER(s.contact_name) LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        query += " GROUP BY s.id ORDER BY s.tier ASC, s.rating DESC"
        rows = conn.execute(query, params).fetchall()
        return success_response(data={"suppliers": rows_to_dict_list(rows)})
    finally:
        conn.close()

@suppliers_bp.route("/<int:supplier_id>", methods=["GET"])
@require_auth()
def get_supplier(supplier_id):
    try:
        supplier = SupplierService.get_by_id(supplier_id, get_target_db())
        if not supplier:
            return error_response("Supplier not found", status_code=404)
        return success_response(data={"supplier": supplier})
    except Exception as e:
        return error_response(f"Failed to fetch supplier: {str(e)}", status_code=500)

@suppliers_bp.route("", methods=["POST"])
@require_auth()
def create_supplier():
    data = request.get_json(silent=True) or {}
    field_errors = {}

    name = (data.get("name") or "").strip()
    code = (data.get("code") or "").strip().upper()
    tier = (data.get("tier") or "Tier B").strip()
    contact_name = (data.get("contact_name") or data.get("contactPerson") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not name:
        field_errors["name"] = "Supplier name is required"
    if not code:
        field_errors["code"] = "Supplier code is required"
    if tier not in ("Tier A", "Tier B", "Tier C"):
        field_errors["tier"] = "Tier must be 'Tier A', 'Tier B', or 'Tier C'"
    if email and not is_valid_email(email):
        field_errors["email"] = "Invalid email format"

    raw_lead = data.get("lead_time_days") if "lead_time_days" in data else data.get("leadTime")
    lead_time = 7
    if raw_lead is not None and str(raw_lead).strip() != "":
        try:
            lead_f = float(raw_lead)
            if not lead_f.is_integer():
                raise ValueError
            lead_time = int(lead_f)
            if lead_time < 0:
                field_errors["lead_time_days"] = "Lead time cannot be negative"
        except (ValueError, TypeError):
            field_errors["lead_time_days"] = "Invalid lead time days"

    raw_rating = data.get("rating")
    rating = 4.5
    if raw_rating is not None and str(raw_rating).strip() != "":
        try:
            rating = float(raw_rating)
            if rating < 0.0 or rating > 5.0:
                field_errors["rating"] = "Rating must be between 0.0 and 5.0"
        except (ValueError, TypeError):
            field_errors["rating"] = "Invalid rating"

    if field_errors:
        msg = "Supplier name and code are required" if ("name" in field_errors and "code" in field_errors) else next(iter(field_errors.values()))
        return error_response(msg, status_code=400, errors=field_errors)

    conn = get_db(get_target_db())
    try:
        existing = conn.execute("SELECT id FROM suppliers WHERE code = ?", (code,)).fetchone()
        if existing:
            return error_response(
                f"Supplier code '{code}' already exists",
                status_code=400,
                errors={"code": f"Supplier code '{code}' already exists"},
            )

        cur = conn.execute(
            """
            INSERT INTO suppliers (name, code, tier, contact_name, email, phone, lead_time_days, rating, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
            """,
            (name, code, tier, contact_name, email, phone, lead_time, rating)
        )
        new_id = cur.lastrowid
        conn.commit()
        created_row = conn.execute("SELECT * FROM suppliers WHERE id = ?", (new_id,)).fetchone()
        return success_response(data={"id": new_id, "code": code, "name": name, "supplier": row_to_dict(created_row)}, message="Supplier created successfully", status_code=201)
    except Exception as e:
        return error_response(f"Failed to create supplier: {str(e)}", status_code=400)
    finally:
        conn.close()

@suppliers_bp.route("/import", methods=["POST"])
@require_auth()
def import_suppliers_csv():
    return handle_csv_import_route(
        request,
        "suppliers",
        lambda rows, opts, actor, db: CsvImportService.import_suppliers(
            rows, mode=opts["mode"], actor_username=actor, db_path=db
        ),
        db_path=get_target_db(),
    )

@suppliers_bp.route("/<int:supplier_id>", methods=["PUT", "PATCH"])
@require_auth()
def update_supplier(supplier_id):
    data = request.get_json(silent=True) or {}
    conn = get_db(get_target_db())
    try:
        existing = conn.execute("SELECT * FROM suppliers WHERE id = ?", (supplier_id,)).fetchone()
        if not existing:
            return error_response("Supplier not found", status_code=404)

        field_errors = {}

        name = data.get("name")
        if name is not None:
            name = str(name).strip()
            if not name:
                field_errors["name"] = "Supplier name cannot be empty"
        else:
            name = existing["name"]

        code = data.get("code")
        if code is not None:
            code = str(code).strip().upper()
            if not code:
                field_errors["code"] = "Supplier code cannot be empty"
            else:
                dup = conn.execute("SELECT id FROM suppliers WHERE code = ? AND id != ?", (code, supplier_id)).fetchone()
                if dup:
                    field_errors["code"] = f"Supplier code '{code}' is already in use"
        else:
            code = existing["code"]

        tier = data.get("tier")
        if tier is not None:
            tier = str(tier).strip()
            if tier not in ("Tier A", "Tier B", "Tier C"):
                field_errors["tier"] = "Tier must be 'Tier A', 'Tier B', or 'Tier C'"
        else:
            tier = existing["tier"]

        status = data.get("status")
        if status is not None:
            status = str(status).strip().lower()
            if status not in ("active", "inactive"):
                field_errors["status"] = "Status must be 'active' or 'inactive'"
        else:
            status = existing["status"]

        contact_name = data.get("contact_name") if "contact_name" in data else data.get("contactPerson")
        if contact_name is not None:
            contact_name = str(contact_name).strip()
        else:
            contact_name = existing["contact_name"]

        email = data.get("email")
        if email is not None:
            email = str(email).strip()
            if email and not is_valid_email(email):
                field_errors["email"] = "Invalid email format"
        else:
            email = existing["email"]

        phone = data.get("phone")
        if phone is not None:
            phone = str(phone).strip()
        else:
            phone = existing["phone"]

        lead_time_days = data.get("lead_time_days") if "lead_time_days" in data else data.get("leadTime")
        if lead_time_days is not None and str(lead_time_days).strip() != "":
            try:
                lead_f = float(lead_time_days)
                if not lead_f.is_integer():
                    raise ValueError
                lead_time_days = int(lead_f)
                if lead_time_days < 0:
                    field_errors["lead_time_days"] = "Lead time cannot be negative"
            except (ValueError, TypeError):
                field_errors["lead_time_days"] = "Invalid lead time days"
        else:
            lead_time_days = existing["lead_time_days"]

        rating = data.get("rating")
        if rating is not None and str(rating).strip() != "":
            try:
                rating = float(rating)
                if rating < 0.0 or rating > 5.0:
                    field_errors["rating"] = "Rating must be between 0.0 and 5.0"
            except (ValueError, TypeError):
                field_errors["rating"] = "Invalid rating"
        else:
            rating = existing["rating"]

        if field_errors:
            return error_response(next(iter(field_errors.values())), status_code=400, errors=field_errors)

        conn.execute(
            """
            UPDATE suppliers
            SET name = ?, code = ?, tier = ?, contact_name = ?, email = ?, phone = ?, lead_time_days = ?, rating = ?, status = ?
            WHERE id = ?
            """,
            (name, code, tier, contact_name, email, phone, lead_time_days, rating, status, supplier_id)
        )
        conn.commit()

        updated_row = conn.execute("SELECT * FROM suppliers WHERE id = ?", (supplier_id,)).fetchone()
        updated_dict = row_to_dict(updated_row)
        return success_response(data={"supplier": updated_dict, "id": supplier_id}, message="Supplier updated successfully")
    except Exception as e:
        return error_response(f"Failed to update supplier: {str(e)}", status_code=400)
    finally:
        conn.close()

@suppliers_bp.route("/<int:supplier_id>", methods=["DELETE"])
@require_auth(roles=["admin", "manager"])
def delete_supplier(supplier_id):
    conn = get_db(get_target_db())
    try:
        supp = conn.execute("SELECT * FROM suppliers WHERE id = ?", (supplier_id,)).fetchone()
        if not supp:
            return error_response("Supplier not found", status_code=404)

        conn.execute("DELETE FROM suppliers WHERE id = ?", (supplier_id,))
        conn.commit()
        return success_response(data={"deleted": True, "id": supplier_id}, message="Supplier deleted successfully")
    except Exception as e:
        return error_response(f"Failed to delete supplier: {str(e)}", status_code=500)
    finally:
        conn.close()
