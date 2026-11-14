from datetime import date
from flask import Blueprint, request, current_app
from backend.database.connection import get_db
from backend.services.movement_service import MovementService
from backend.services.csv_import_service import CsvImportService, handle_csv_import_route
from backend.utils.responses import success_response, error_response, rows_to_csv_response
from backend.utils.auth import require_auth

movements_bp = Blueprint("movements", __name__, url_prefix="/api/movements")

def get_target_db():
    return current_app.config.get("DATABASE_PATH")

@movements_bp.route("", methods=["GET"])
@require_auth()
def get_movements():
    try:
        limit = min(max(request.args.get("limit", default=50, type=int), 1), 5000)
        offset = max(request.args.get("offset", default=0, type=int), 0)
        m_type = request.args.get("type")
        search = request.args.get("search")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        db_path = get_target_db()
        movements = MovementService.get_recent(
            limit=limit, offset=offset, m_type=m_type, search=search,
            start_date=start_date, end_date=end_date, db_path=db_path,
        )
        total, filtered_total = MovementService.get_counts(
            m_type=m_type, search=search, start_date=start_date, end_date=end_date, db_path=db_path,
        )
        return success_response(data={
            "movements": movements,
            "total": total,
            "filtered_total": filtered_total,
            "limit": limit,
            "offset": offset,
        })
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Failed to fetch movements: {str(e)}", status_code=500)

@movements_bp.route("/export", methods=["GET"])
@require_auth()
def export_movements_csv():
    try:
        m_type = request.args.get("type")
        search = request.args.get("search")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        movements = MovementService.get_recent(
            limit=None, offset=0, m_type=m_type, search=search,
            start_date=start_date, end_date=end_date, db_path=get_target_db(),
        )
        csv_rows = [
            [
                m.get("product_sku", ""),
                m.get("product_name", ""),
                m.get("type", ""),
                m.get("quantity", 0),
                m.get("reference_no") or "",
                m.get("performed_by") or "",
                m.get("notes") or "",
                m.get("created_at") or "",
            ]
            for m in movements
        ]
        return rows_to_csv_response(
            f"stockflow-movements-{date.today().isoformat()}.csv",
            ["sku", "product_name", "type", "quantity", "reference_no", "performed_by", "notes", "created_at"],
            csv_rows,
        )
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Failed to export movements: {str(e)}", status_code=500)

@movements_bp.route("", methods=["POST"])
@require_auth()
def record_movement():
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    m_type = (data.get("type") or "").upper()
    raw_qty = data.get("quantity")
    try:
        qty_float = float(raw_qty)
        if not qty_float.is_integer():
            raise ValueError
        quantity = int(qty_float)
    except (ValueError, TypeError):
        return error_response("Quantity must be a valid integer", status_code=400, errors={"quantity": "Quantity must be a valid integer"})

    reference_no = (data.get("reference_no") or "").strip()
    actor = getattr(request, "current_user", None)
    actor_username = actor.get("username") if actor else "user"
    performed_by = (data.get("performed_by") or actor_username).strip()
    notes = (data.get("notes") or "").strip()

    if not product_id or m_type not in ("INBOUND", "OUTBOUND", "ADJUSTMENT", "TRANSFER"):
        return error_response("Valid product_id and type (INBOUND, OUTBOUND, ADJUSTMENT, TRANSFER) are required", status_code=400)

    try:
        product_id = int(product_id)
    except (ValueError, TypeError):
        return error_response("Invalid product_id", status_code=400, errors={"product_id": "Please select a valid product"})

    if quantity == 0:
        return error_response("Quantity cannot be zero", status_code=400, errors={"quantity": "Quantity cannot be zero"})

    if m_type in ("INBOUND", "OUTBOUND", "TRANSFER") and quantity < 0:
        return error_response(f"Quantity for {m_type} must be positive", status_code=400, errors={"quantity": f"Quantity for {m_type} must be positive"})

    conn = get_db(get_target_db())
    try:
        conn.execute("BEGIN IMMEDIATE")
        prod = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        if not prod:
            conn.rollback()
            return error_response("Product not found", status_code=404, errors={"product_id": "Selected product was not found"})

        current_stock = prod["current_stock"]
        new_stock = current_stock
        norm_qty = abs(quantity)
        record_qty = norm_qty
        target_product_id = data.get("target_product_id")

        if m_type == "INBOUND":
            new_stock = current_stock + norm_qty
        elif m_type == "OUTBOUND":
            if current_stock < norm_qty:
                conn.rollback()
                return error_response(
                    f"Insufficient stock ({current_stock} available, requested {norm_qty})",
                    status_code=400,
                    errors={"quantity": f"Insufficient stock ({current_stock} available)"},
                )
            new_stock = current_stock - norm_qty
        elif m_type == "ADJUSTMENT":
            if current_stock + quantity < 0:
                conn.rollback()
                return error_response(
                    "Adjustment would result in negative stock",
                    status_code=400,
                    errors={"quantity": f"Adjustment would make stock negative ({current_stock + quantity})"},
                )
            if not notes:
                conn.rollback()
                return error_response(
                    "Reason / notes are required for stock adjustments",
                    status_code=400,
                    errors={"notes": "Please provide a reason for this stock adjustment"},
                )
            new_stock = current_stock + quantity
            record_qty = quantity
        elif m_type == "TRANSFER":
            if target_product_id is None or str(target_product_id).strip() == "":
                conn.rollback()
                return error_response(
                    "Destination product ID (target_product_id) is required for transfer",
                    status_code=400,
                    errors={"target_product_id": "Select a destination product for transfer"},
                )
            try:
                target_product_id = int(target_product_id)
            except (ValueError, TypeError):
                conn.rollback()
                return error_response(
                    "Invalid destination product ID (target_product_id)",
                    status_code=400,
                    errors={"target_product_id": "Select a valid destination product"},
                )
            if target_product_id == product_id:
                conn.rollback()
                return error_response(
                    "Cannot transfer to the same product",
                    status_code=400,
                    errors={"target_product_id": "Destination product must differ from source product"},
                )
            if norm_qty <= 0:
                conn.rollback()
                return error_response("Transfer quantity must be greater than zero", status_code=400, errors={"quantity": "Transfer quantity must be greater than zero"})
            if current_stock < norm_qty:
                conn.rollback()
                return error_response(
                    f"Insufficient stock for transfer ({current_stock} available, requested {norm_qty})",
                    status_code=400,
                    errors={"quantity": f"Insufficient stock ({current_stock} available)"},
                )

            target_prod = conn.execute("SELECT * FROM products WHERE id = ?", (target_product_id,)).fetchone()
            if not target_prod:
                conn.rollback()
                return error_response(f"Target product {target_product_id} not found", status_code=404, errors={"target_product_id": "Destination product was not found"})

            new_stock = current_stock - norm_qty
            target_new_stock = target_prod["current_stock"] + norm_qty
            target_status = "in_stock"
            if target_new_stock == 0:
                target_status = "out_of_stock"
            elif target_new_stock <= target_prod["min_stock"]:
                target_status = "low_stock"

            conn.execute(
                "UPDATE products SET current_stock = ?, status = ? WHERE id = ?",
                (target_new_stock, target_status, target_product_id)
            )
            dest_note = f"Transferred from SKU {prod['sku']}" + (f" · {notes}" if notes else "")
            conn.execute(
                """
                INSERT INTO movements (product_id, type, quantity, reference_no, performed_by, notes)
                VALUES (?, 'INBOUND', ?, ?, ?, ?)
                """,
                (target_product_id, norm_qty, reference_no or f"TRF-FROM-{prod['sku']}", performed_by, dest_note)
            )
            if not notes:
                notes = f"Transferred to SKU {target_prod['sku']}"
            else:
                notes = f"To SKU {target_prod['sku']} · {notes}"

        new_status = "in_stock"
        if new_stock == 0:
            new_status = "out_of_stock"
        elif new_stock <= prod["min_stock"]:
            new_status = "low_stock"

        # Update source stock
        conn.execute(
            "UPDATE products SET current_stock = ?, status = ? WHERE id = ?",
            (new_stock, new_status, product_id)
        )

        cur = conn.execute(
            """
            INSERT INTO movements (product_id, type, quantity, reference_no, performed_by, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (product_id, m_type, record_qty, reference_no, performed_by, notes)
        )

        # Audit log
        conn.execute(
            """
            INSERT INTO audit_logs (username, action, details, status)
            VALUES (?, 'STOCK_MOVEMENT', ?, 'success')
            """,
            (performed_by, f"{m_type} {record_qty} units for SKU {prod['sku']} (new stock: {new_stock})")
        )

        conn.commit()
        return success_response(
            data={"movement_id": cur.lastrowid, "new_stock": new_stock, "status": new_status},
            message=f"{m_type} movement registered successfully",
            status_code=201
        )
    except Exception as e:
        conn.rollback()
        return error_response(f"Failed to record movement: {str(e)}", status_code=400)
    finally:
        conn.close()

@movements_bp.route("/import", methods=["POST"])
@require_auth()
def import_movements_csv():
    return handle_csv_import_route(
        request,
        "movements",
        lambda rows, opts, actor, db: CsvImportService.import_movements(
            rows, mode=opts["mode"], apply_stock=opts["apply_stock"], actor_username=actor, db_path=db
        ),
        db_path=get_target_db(),
    )
