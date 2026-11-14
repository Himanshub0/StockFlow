from datetime import date
from flask import Blueprint, request, current_app
from backend.database.connection import get_db, rows_to_dict_list
from backend.services.product_service import ProductService
from backend.services.inventory_service import InventoryService
from backend.services.csv_import_service import CsvImportService, handle_csv_import_route
from backend.utils.responses import success_response, error_response, rows_to_csv_response
from backend.utils.auth import require_auth

products_bp = Blueprint("products", __name__, url_prefix="/api/products")

def get_target_db():
    return current_app.config.get("DATABASE_PATH")

def _build_product_filter(args):
    category = args.get("category")
    status = args.get("status")
    search = (args.get("search") or "").strip().lower()
    where_sql = " WHERE 1=1"
    params = []
    if category and category != "all":
        where_sql += " AND p.category = ?"
        params.append(category)
    if status and status != "all":
        where_sql += " AND p.status = ?"
        params.append(status)
    if search:
        where_sql += " AND (LOWER(p.name) LIKE ? OR LOWER(p.sku) LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    return where_sql, params

@products_bp.route("", methods=["GET"])
@require_auth()
def get_products():
    conn = get_db(get_target_db())
    try:
        limit = min(max(request.args.get("limit", default=100, type=int), 1), 5000)
        offset = max(request.args.get("offset", default=0, type=int), 0)
        where_sql, params = _build_product_filter(request.args)

        query = f"""
            SELECT p.*, s.name as supplier_name, s.code as supplier_code
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            {where_sql}
            ORDER BY p.id DESC LIMIT ? OFFSET ?
        """
        rows = conn.execute(query, params + [limit, offset]).fetchall()
        total_count = conn.execute("SELECT COUNT(*) as count FROM products").fetchone()["count"]
        filtered_count = conn.execute(f"SELECT COUNT(*) as count FROM products p {where_sql}", params).fetchone()["count"]
        categories = [r["category"] for r in conn.execute("SELECT DISTINCT category FROM products ORDER BY category ASC").fetchall()]

        return success_response(data={
            "products": rows_to_dict_list(rows),
            "total": total_count,
            "filtered_total": filtered_count,
            "categories": categories,
            "limit": limit,
            "offset": offset
        })
    finally:
        conn.close()

@products_bp.route("/export", methods=["GET"])
@require_auth()
def export_products_csv():
    conn = get_db(get_target_db())
    try:
        where_sql, params = _build_product_filter(request.args)
        currency = InventoryService.get_currency(conn)
        rows = conn.execute(
            f"""
            SELECT p.sku, p.name, p.category, p.unit_price, p.current_stock, p.min_stock, p.max_stock,
                   COALESCE(s.code, '') as supplier_code, COALESCE(s.name, '') as supplier_name
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            {where_sql}
            ORDER BY p.id DESC
            """,
            params,
        ).fetchall()
        csv_rows = [
            [
                r["sku"],
                r["name"],
                r["category"],
                f"{float(r['unit_price'] or 0.0):.2f}",
                currency,
                r["current_stock"],
                r["min_stock"],
                r["max_stock"],
                r["supplier_code"],
                r["supplier_name"],
            ]
            for r in rows
        ]
        return rows_to_csv_response(
            f"stockflow-products-{date.today().isoformat()}.csv",
            ["sku", "name", "category", "unit_price", "currency", "current_stock", "min_stock", "max_stock", "supplier_code", "supplier_name"],
            csv_rows,
        )
    finally:
        conn.close()

@products_bp.route("/<int:product_id>", methods=["GET"])
@require_auth()
def get_product(product_id):
    try:
        product = ProductService.get_by_id(product_id, get_target_db())
        if not product:
            return error_response("Product not found", status_code=404)
        return success_response(data={"product": product})
    except Exception as e:
        return error_response(f"Failed to fetch product: {str(e)}", status_code=500)

def _pick_provided(data, *keys):
    for key in keys:
        if key in data:
            return data.get(key), True
    return None, False

def _parse_float_field(val, label, field_key, errors):
    if val is None or str(val).strip() == "":
        errors[field_key] = f"{label} is required"
        return None
    try:
        parsed = float(val)
    except (ValueError, TypeError):
        errors[field_key] = f"{label} must be a valid number"
        return None
    if parsed < 0:
        errors[field_key] = f"{label} cannot be negative"
        return None
    return parsed

def _parse_int_field(val, label, field_key, errors):
    if val is None or str(val).strip() == "":
        errors[field_key] = f"{label} is required"
        return None
    try:
        num = float(val)
        if not num.is_integer():
            errors[field_key] = f"{label} must be a whole number"
            return None
        parsed = int(num)
    except (ValueError, TypeError):
        errors[field_key] = f"{label} must be a valid whole number"
        return None
    if parsed < 0:
        errors[field_key] = f"{label} cannot be negative"
        return None
    return parsed

@products_bp.route("", methods=["POST"])
@require_auth()
def create_product():
    data = request.get_json(silent=True) or {}
    field_errors = {}

    sku = str(data.get("sku") or "").strip().upper()
    name = str(data.get("name") or "").strip()
    raw_cat, has_cat = _pick_provided(data, "category")
    category = str(raw_cat).strip() if has_cat and raw_cat is not None else "General"

    if not sku:
        field_errors["sku"] = "SKU is required"
    if not name:
        field_errors["name"] = "Product name is required"
    if has_cat and not category:
        field_errors["category"] = "Category is required"

    raw_price, has_price = _pick_provided(data, "unit_price", "price")
    unit_price = _parse_float_field(raw_price, "Unit price", "unit_price", field_errors) if has_price else 0.0

    raw_stock, has_stock = _pick_provided(data, "current_stock", "quantity")
    current_stock = _parse_int_field(raw_stock, "Current stock", "current_stock", field_errors) if has_stock else 0

    raw_min, has_min = _pick_provided(data, "min_stock", "minimumStock")
    min_stock = _parse_int_field(raw_min, "Minimum stock", "min_stock", field_errors) if has_min else 10

    raw_max, has_max = _pick_provided(data, "max_stock")
    max_stock = _parse_int_field(raw_max, "Maximum stock", "max_stock", field_errors) if has_max else 500

    if min_stock is not None and max_stock is not None and max_stock < min_stock:
        field_errors["max_stock"] = "Maximum stock must be greater than or equal to minimum stock"

    raw_supp, _ = _pick_provided(data, "supplier_id", "supplierId")
    supplier_id = None
    if raw_supp is not None and str(raw_supp).strip() != "":
        try:
            supplier_id = int(raw_supp)
        except (ValueError, TypeError):
            field_errors["supplier_id"] = "Invalid supplier selection"

    if field_errors:
        if "sku" in field_errors or "name" in field_errors:
            if not sku and not name:
                msg = "SKU and Name are mandatory fields"
            else:
                msg = next(iter(field_errors.values()))
        else:
            msg = next(iter(field_errors.values()))
        return error_response(msg, status_code=400, errors=field_errors)

    status = "in_stock"
    if current_stock == 0:
        status = "out_of_stock"
    elif current_stock <= min_stock:
        status = "low_stock"

    conn = get_db(get_target_db())
    try:
        # Check duplicate SKU
        existing = conn.execute("SELECT id FROM products WHERE sku = ?", (sku,)).fetchone()
        if existing:
            return error_response(
                f"Product SKU '{sku}' already exists",
                status_code=400,
                errors={"sku": f"Product SKU '{sku}' already exists"},
            )

        if supplier_id is not None:
            supp_exists = conn.execute("SELECT id FROM suppliers WHERE id = ?", (supplier_id,)).fetchone()
            if not supp_exists:
                return error_response(
                    "Selected supplier does not exist",
                    status_code=400,
                    errors={"supplier_id": "Selected supplier does not exist"},
                )

        cur = conn.execute(
            """
            INSERT INTO products (sku, name, category, unit_price, current_stock, min_stock, max_stock, supplier_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (sku, name, category, unit_price, current_stock, min_stock, max_stock, supplier_id, status)
        )
        new_id = cur.lastrowid
        conn.execute(
            """
            INSERT INTO audit_logs (username, action, details, status)
            VALUES ('system', 'PRODUCT_CREATED', ?, 'success')
            """,
            (f"Created SKU {sku}: {name} ({current_stock} units)",)
        )
        conn.commit()
        return success_response(data={"id": new_id, "sku": sku, "status": status}, message="Product created successfully", status_code=201)
    except Exception as e:
        return error_response(f"Failed to create product: {str(e)}", status_code=400)
    finally:
        conn.close()

@products_bp.route("/import", methods=["POST"])
@require_auth()
def import_products_csv():
    return handle_csv_import_route(
        request,
        "products",
        lambda rows, opts, actor, db: CsvImportService.import_products(
            rows, mode=opts["mode"], actor_username=actor, db_path=db
        ),
        db_path=get_target_db(),
    )

@products_bp.route("/<int:product_id>", methods=["PUT", "PATCH"])
@require_auth()
def update_product(product_id):
    data = request.get_json(silent=True) or {}
    conn = get_db(get_target_db())
    try:
        prod = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        if not prod:
            return error_response("Product not found", status_code=404)

        field_errors = {}

        if "name" in data:
            name = str(data.get("name") or "").strip()
            if not name:
                field_errors["name"] = "Product name is required"
        else:
            name = prod["name"]

        if "category" in data:
            category = str(data.get("category") or "").strip()
            if not category:
                field_errors["category"] = "Category is required"
        else:
            category = prod["category"]

        if "unit_price" in data or "price" in data:
            raw_price, _ = _pick_provided(data, "unit_price", "price")
            unit_price = _parse_float_field(raw_price, "Unit price", "unit_price", field_errors)
        else:
            unit_price = prod["unit_price"]

        if "current_stock" in data or "quantity" in data:
            raw_stock, _ = _pick_provided(data, "current_stock", "quantity")
            current_stock = _parse_int_field(raw_stock, "Current stock", "current_stock", field_errors)
        else:
            current_stock = prod["current_stock"]

        if "min_stock" in data or "minimumStock" in data:
            raw_min, _ = _pick_provided(data, "min_stock", "minimumStock")
            min_stock = _parse_int_field(raw_min, "Minimum stock", "min_stock", field_errors)
        else:
            min_stock = prod["min_stock"]

        if "max_stock" in data:
            max_stock = _parse_int_field(data.get("max_stock"), "Maximum stock", "max_stock", field_errors)
        else:
            max_stock = prod["max_stock"]

        if min_stock is not None and max_stock is not None and max_stock < min_stock:
            field_errors["max_stock"] = "Maximum stock must be greater than or equal to minimum stock"

        if "supplier_id" in data or "supplierId" in data:
            raw_supp, _ = _pick_provided(data, "supplier_id", "supplierId")
            if raw_supp is None or str(raw_supp).strip() == "":
                supplier_id = None
            else:
                try:
                    supplier_id = int(raw_supp)
                except (ValueError, TypeError):
                    supplier_id = None
                    field_errors["supplier_id"] = "Invalid supplier selection"
        else:
            supplier_id = prod["supplier_id"]

        if field_errors:
            return error_response(next(iter(field_errors.values())), status_code=400, errors=field_errors)

        if supplier_id is not None:
            supp_exists = conn.execute("SELECT id FROM suppliers WHERE id = ?", (supplier_id,)).fetchone()
            if not supp_exists:
                return error_response(
                    "Selected supplier does not exist",
                    status_code=400,
                    errors={"supplier_id": "Selected supplier does not exist"},
                )

        status = "in_stock"
        if current_stock == 0:
            status = "out_of_stock"
        elif current_stock <= min_stock:
            status = "low_stock"

        conn.execute(
            """
            UPDATE products
            SET name = ?, category = ?, unit_price = ?, current_stock = ?, min_stock = ?, max_stock = ?, supplier_id = ?, status = ?
            WHERE id = ?
            """,
            (name, category, unit_price, current_stock, min_stock, max_stock, supplier_id, status, product_id)
        )
        conn.commit()
        return success_response(data={"id": product_id, "name": name, "status": status}, message="Product updated successfully")
    except Exception as e:
        return error_response(f"Failed to update product: {str(e)}", status_code=400)
    finally:
        conn.close()

@products_bp.route("/<int:product_id>", methods=["DELETE"])
@require_auth(roles=["admin", "manager"])
def delete_product(product_id):
    conn = get_db(get_target_db())
    try:
        prod = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        if not prod:
            return error_response("Product not found", status_code=404)

        conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.execute(
            """
            INSERT INTO audit_logs (username, action, details, status)
            VALUES ('system', 'PRODUCT_DELETED', ?, 'success')
            """,
            (f"Deleted product {prod['sku']} ({prod['name']})",)
        )
        conn.commit()
        return success_response(data={"deleted": True, "id": product_id}, message="Product deleted successfully")
    except Exception as e:
        return error_response(f"Failed to delete product: {str(e)}", status_code=500)
    finally:
        conn.close()
