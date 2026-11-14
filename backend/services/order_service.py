import secrets
from datetime import date, datetime
from backend.database.connection import get_db, row_to_dict, rows_to_dict_list
from backend.services.inventory_service import InventoryService

VALID_PO_STATUSES = {"draft", "ordered", "received", "cancelled"}
VALID_PAYMENT_METHODS = {"cash", "card", "upi", "bank_transfer"}


def _compute_stock_status(current_stock, min_stock):
    if current_stock == 0:
        return "out_of_stock"
    if current_stock <= min_stock:
        return "low_stock"
    return "in_stock"


def _validate_iso_date(val, label):
    if not val:
        return None
    text = str(val).strip()
    try:
        date.fromisoformat(text)
        return text
    except ValueError:
        raise ValueError(f"Invalid {label} format '{text}'. Expected YYYY-MM-DD.")


def _generate_doc_number(prefix):
    stamp = datetime.now().strftime("%Y%m%d")
    suffix = secrets.token_hex(2).upper()
    return f"{prefix}-{stamp}-{suffix}"


class OrderValidationError(ValueError):
    def __init__(self, message, status_code=400, errors=None):
        super().__init__(message)
        self.status_code = status_code
        self.errors = errors or {}


class OrderService:
    @staticmethod
    def _parse_items(raw_items, cost_key):
        if not isinstance(raw_items, list) or not raw_items:
            raise OrderValidationError("At least one product line item is required", errors={"items": "Add at least one product item"})
        parsed = []
        for idx, entry in enumerate(raw_items):
            if not isinstance(entry, dict):
                raise OrderValidationError(f"Line item {idx + 1} is invalid", errors={"items": "Invalid line item format"})
            try:
                pid = int(entry.get("product_id"))
            except (ValueError, TypeError):
                raise OrderValidationError(f"Line item {idx + 1} requires a valid product", errors={"items": f"Select a valid product on row {idx + 1}"})
            raw_qty = entry.get("quantity")
            try:
                qty_f = float(raw_qty)
                if not qty_f.is_integer() or qty_f <= 0:
                    raise ValueError
                qty = int(qty_f)
            except (ValueError, TypeError):
                raise OrderValidationError(f"Quantity on row {idx + 1} must be a positive whole number", errors={"items": f"Quantity on row {idx + 1} must be a positive whole number"})

            raw_price = entry.get(cost_key)
            override_price = None
            if raw_price is not None and str(raw_price).strip() != "":
                try:
                    override_price = float(raw_price)
                    if override_price < 0:
                        raise ValueError
                except (ValueError, TypeError):
                    raise OrderValidationError(f"Unit amount on row {idx + 1} cannot be negative", errors={"items": f"Unit amount on row {idx + 1} must be 0 or higher"})

            parsed.append({"product_id": pid, "quantity": qty, "override_price": override_price})
        return parsed

    @staticmethod
    def _attach_po_items(conn, orders):
        if not orders:
            return orders
        po_ids = [o["id"] for o in orders]
        placeholders = ",".join("?" for _ in po_ids)
        item_rows = conn.execute(
            f"""
            SELECT i.*, p.name as product_name, p.sku as product_sku, p.current_stock as current_stock
            FROM purchase_order_items i
            JOIN products p ON i.product_id = p.id
            WHERE i.purchase_order_id IN ({placeholders})
            ORDER BY i.id ASC
            """,
            po_ids,
        ).fetchall()
        grouped = {pid: [] for pid in po_ids}
        for row in item_rows:
            d = row_to_dict(row)
            grouped[d["purchase_order_id"]].append(d)
        for o in orders:
            o["items"] = grouped.get(o["id"], [])
        return orders

    @staticmethod
    def _attach_sales_items(conn, orders):
        if not orders:
            return orders
        so_ids = [o["id"] for o in orders]
        placeholders = ",".join("?" for _ in so_ids)
        item_rows = conn.execute(
            f"""
            SELECT i.*, p.name as product_name, p.sku as product_sku
            FROM sales_order_items i
            JOIN products p ON i.product_id = p.id
            WHERE i.sales_order_id IN ({placeholders})
            ORDER BY i.id ASC
            """,
            so_ids,
        ).fetchall()
        grouped = {sid: [] for sid in so_ids}
        for row in item_rows:
            d = row_to_dict(row)
            grouped[d["sales_order_id"]].append(d)
        for o in orders:
            o["items"] = grouped.get(o["id"], [])
        return orders

    # ---------- Purchase Orders ----------

    @staticmethod
    def list_purchase_orders(limit=50, offset=0, status=None, search=None, db_path=None):
        conn = get_db(db_path)
        try:
            where_sql = " WHERE 1=1"
            params = []
            if status and status != "all":
                where_sql += " AND po.status = ?"
                params.append(status.lower())
            if search and search.strip():
                term = f"%{search.strip().lower()}%"
                where_sql += " AND (LOWER(po.po_number) LIKE ? OR LOWER(COALESCE(s.name, '')) LIKE ? OR LOWER(COALESCE(po.notes, '')) LIKE ?)"
                params.extend([term, term, term])

            rows = conn.execute(
                f"""
                SELECT po.*, s.name as supplier_name, s.code as supplier_code
                FROM purchase_orders po
                LEFT JOIN suppliers s ON po.supplier_id = s.id
                {where_sql}
                ORDER BY po.created_at DESC, po.id DESC
                LIMIT ? OFFSET ?
                """,
                params + [limit, offset],
            ).fetchall()
            orders = OrderService._attach_po_items(conn, rows_to_dict_list(rows))
            total = conn.execute("SELECT COUNT(*) as c FROM purchase_orders").fetchone()["c"]
            filtered = conn.execute(
                f"SELECT COUNT(*) as c FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id {where_sql}",
                params,
            ).fetchone()["c"]
            return {
                "purchase_orders": orders,
                "total": total,
                "filtered_total": filtered,
                "currency": InventoryService.get_currency(conn),
            }
        finally:
            conn.close()

    @staticmethod
    def create_purchase_order(data, actor_username="system", db_path=None):
        items = OrderService._parse_items(data.get("items"), "unit_cost")
        status = (data.get("status") or "ordered").strip().lower()
        if status not in ("draft", "ordered"):
            raise OrderValidationError("Initial PO status must be 'draft' or 'ordered'", errors={"status": "Choose Draft or Ordered"})

        raw_supp = data.get("supplier_id")
        supplier_id = None
        if raw_supp is not None and str(raw_supp).strip() != "":
            try:
                supplier_id = int(raw_supp)
            except (ValueError, TypeError):
                raise OrderValidationError("Invalid supplier selection", errors={"supplier_id": "Select a valid supplier"})

        po_number = str(data.get("po_number") or "").strip().upper() or _generate_doc_number("PO")
        notes = str(data.get("notes") or "").strip()

        conn = get_db(db_path)
        try:
            conn.execute("BEGIN IMMEDIATE")
            if conn.execute("SELECT id FROM purchase_orders WHERE po_number = ?", (po_number,)).fetchone():
                raise OrderValidationError(f"PO number '{po_number}' already exists", errors={"po_number": f"PO number '{po_number}' already exists"})

            if supplier_id is not None:
                if not conn.execute("SELECT id FROM suppliers WHERE id = ?", (supplier_id,)).fetchone():
                    raise OrderValidationError("Selected supplier does not exist", errors={"supplier_id": "Selected supplier does not exist"})

            resolved_items = []
            total_cost = 0.0
            for item in items:
                prod = conn.execute("SELECT id, unit_price, name, sku FROM products WHERE id = ?", (item["product_id"],)).fetchone()
                if not prod:
                    raise OrderValidationError(f"Product ID {item['product_id']} not found", status_code=404, errors={"items": "One or more selected products no longer exist"})
                unit_cost = item["override_price"] if item["override_price"] is not None else float(prod["unit_price"] or 0.0)
                total_cost += unit_cost * item["quantity"]
                resolved_items.append((prod["id"], item["quantity"], round(unit_cost, 2)))

            cur = conn.execute(
                """
                INSERT INTO purchase_orders (po_number, supplier_id, status, total_cost, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (po_number, supplier_id, status, round(total_cost, 2), notes, actor_username),
            )
            po_id = cur.lastrowid
            for pid, qty, cost in resolved_items:
                conn.execute(
                    "INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost) VALUES (?, ?, ?, ?)",
                    (po_id, pid, qty, cost),
                )
            conn.execute(
                "INSERT INTO audit_logs (username, action, details, status) VALUES (?, 'PO_CREATED', ?, 'success')",
                (actor_username, f"Created PO {po_number} ({len(resolved_items)} lines, total {round(total_cost, 2)})"),
            )
            conn.commit()
            row = conn.execute(
                "SELECT po.*, s.name as supplier_name, s.code as supplier_code FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?",
                (po_id,),
            ).fetchone()
            return OrderService._attach_po_items(conn, [row_to_dict(row)])[0]
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def receive_purchase_order(po_id, actor_username="system", db_path=None):
        conn = get_db(db_path)
        try:
            conn.execute("BEGIN IMMEDIATE")
            po = conn.execute("SELECT * FROM purchase_orders WHERE id = ?", (po_id,)).fetchone()
            if not po:
                raise OrderValidationError("Purchase order not found", status_code=404)
            if po["status"] == "received":
                raise OrderValidationError("Purchase order has already been received", status_code=400)
            if po["status"] == "cancelled":
                raise OrderValidationError("Cancelled purchase orders cannot be received", status_code=400)

            items = conn.execute("SELECT * FROM purchase_order_items WHERE purchase_order_id = ?", (po_id,)).fetchall()
            if not items:
                raise OrderValidationError("Purchase order has no items to receive", status_code=400)

            for line in items:
                prod = conn.execute("SELECT * FROM products WHERE id = ?", (line["product_id"],)).fetchone()
                if not prod:
                    raise OrderValidationError(f"Product {line['product_id']} no longer exists", status_code=404)
                new_stock = prod["current_stock"] + int(line["quantity"])
                new_status = _compute_stock_status(new_stock, prod["min_stock"])
                conn.execute(
                    "UPDATE products SET current_stock = ?, status = ? WHERE id = ?",
                    (new_stock, new_status, prod["id"]),
                )
                conn.execute(
                    """
                    INSERT INTO movements (product_id, type, quantity, reference_no, performed_by, notes)
                    VALUES (?, 'INBOUND', ?, ?, ?, ?)
                    """,
                    (prod["id"], int(line["quantity"]), po["po_number"], actor_username, f"Received Purchase Order {po['po_number']}"),
                )

            conn.execute(
                "UPDATE purchase_orders SET status = 'received', received_at = CURRENT_TIMESTAMP WHERE id = ?",
                (po_id,),
            )
            conn.execute(
                "INSERT INTO audit_logs (username, action, details, status) VALUES (?, 'PO_RECEIVED', ?, 'success')",
                (actor_username, f"Received PO {po['po_number']} ({len(items)} line items added to stock)"),
            )
            conn.commit()
            updated = conn.execute(
                "SELECT po.*, s.name as supplier_name, s.code as supplier_code FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?",
                (po_id,),
            ).fetchone()
            return OrderService._attach_po_items(conn, [row_to_dict(updated)])[0]
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def cancel_purchase_order(po_id, actor_username="system", db_path=None):
        conn = get_db(db_path)
        try:
            conn.execute("BEGIN IMMEDIATE")
            po = conn.execute("SELECT * FROM purchase_orders WHERE id = ?", (po_id,)).fetchone()
            if not po:
                raise OrderValidationError("Purchase order not found", status_code=404)
            if po["status"] == "received":
                raise OrderValidationError("Received purchase orders cannot be cancelled", status_code=400)
            if po["status"] == "cancelled":
                raise OrderValidationError("Purchase order is already cancelled", status_code=400)
            conn.execute("UPDATE purchase_orders SET status = 'cancelled' WHERE id = ?", (po_id,))
            conn.execute(
                "INSERT INTO audit_logs (username, action, details, status) VALUES (?, 'PO_CANCELLED', ?, 'success')",
                (actor_username, f"Cancelled PO {po['po_number']}"),
            )
            conn.commit()
            return {"id": po_id, "po_number": po["po_number"], "status": "cancelled"}
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    # ---------- Sales Orders & Billing ----------

    @staticmethod
    def list_sales_orders(limit=50, offset=0, status=None, search=None, start_date=None, end_date=None, db_path=None):
        start_iso = _validate_iso_date(start_date, "start_date")
        end_iso = _validate_iso_date(end_date, "end_date")
        if start_iso and end_iso and start_iso > end_iso:
            raise OrderValidationError("Start date cannot be after end date.")

        conn = get_db(db_path)
        try:
            where_sql = " WHERE 1=1"
            params = []
            if status and status != "all":
                where_sql += " AND status = ?"
                params.append(status.lower())
            if search and search.strip():
                term = f"%{search.strip().lower()}%"
                where_sql += " AND (LOWER(invoice_number) LIKE ? OR LOWER(COALESCE(customer_name, '')) LIKE ? OR LOWER(COALESCE(notes, '')) LIKE ?)"
                params.extend([term, term, term])
            if start_iso:
                where_sql += " AND date(created_at) >= ?"
                params.append(start_iso)
            if end_iso:
                where_sql += " AND date(created_at) <= ?"
                params.append(end_iso)

            rows = conn.execute(
                f"SELECT * FROM sales_orders {where_sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?",
                params + [limit, offset],
            ).fetchall()
            orders = OrderService._attach_sales_items(conn, rows_to_dict_list(rows))
            total = conn.execute("SELECT COUNT(*) as c FROM sales_orders").fetchone()["c"]
            filtered = conn.execute(f"SELECT COUNT(*) as c FROM sales_orders {where_sql}", params).fetchone()["c"]
            return {
                "sales_orders": orders,
                "total": total,
                "filtered_total": filtered,
                "currency": InventoryService.get_currency(conn),
            }
        finally:
            conn.close()

    @staticmethod
    def create_sales_order(data, actor_username="system", db_path=None):
        items = OrderService._parse_items(data.get("items"), "unit_price")
        customer_name = str(data.get("customer_name") or "").strip() or "Walk-in Customer"
        customer_contact = str(data.get("customer_contact") or "").strip()
        payment_method = str(data.get("payment_method") or "cash").strip().lower()
        if payment_method not in VALID_PAYMENT_METHODS:
            raise OrderValidationError(
                f"Payment method must be one of: {', '.join(sorted(VALID_PAYMENT_METHODS))}",
                errors={"payment_method": "Choose Cash, Card, UPI, or Bank transfer"},
            )

        raw_discount = data.get("discount", 0)
        try:
            discount = float(raw_discount if raw_discount is not None and str(raw_discount).strip() != "" else 0.0)
            if discount < 0:
                raise ValueError
        except (ValueError, TypeError):
            raise OrderValidationError("Discount cannot be negative", errors={"discount": "Discount must be 0 or higher"})

        invoice_number = str(data.get("invoice_number") or "").strip().upper() or _generate_doc_number("INV")
        notes = str(data.get("notes") or "").strip()

        conn = get_db(db_path)
        try:
            conn.execute("BEGIN IMMEDIATE")
            if conn.execute("SELECT id FROM sales_orders WHERE invoice_number = ?", (invoice_number,)).fetchone():
                raise OrderValidationError(f"Invoice number '{invoice_number}' already exists", errors={"invoice_number": f"Invoice number '{invoice_number}' already exists"})

            # Aggregate quantities per product to check stock holistically across duplicate lines
            qty_by_pid = {}
            for item in items:
                qty_by_pid[item["product_id"]] = qty_by_pid.get(item["product_id"], 0) + item["quantity"]

            products_map = {}
            for pid, needed_qty in qty_by_pid.items():
                prod = conn.execute("SELECT * FROM products WHERE id = ?", (pid,)).fetchone()
                if not prod:
                    raise OrderValidationError(f"Product ID {pid} not found", status_code=404, errors={"items": "One or more selected products were not found"})
                if prod["current_stock"] < needed_qty:
                    raise OrderValidationError(
                        f"Insufficient stock for {prod['name']} ({prod['sku']}): {prod['current_stock']} available, requested {needed_qty}",
                        errors={"items": f"Insufficient stock for {prod['sku']}: {prod['current_stock']} available, requested {needed_qty}"},
                    )
                products_map[pid] = prod

            subtotal = 0.0
            resolved_items = []
            for item in items:
                prod = products_map[item["product_id"]]
                unit_price = item["override_price"] if item["override_price"] is not None else float(prod["unit_price"] or 0.0)
                subtotal += unit_price * item["quantity"]
                resolved_items.append((prod["id"], item["quantity"], round(unit_price, 2)))

            subtotal = round(subtotal, 2)
            discount = round(discount, 2)
            if discount > subtotal:
                raise OrderValidationError("Discount cannot exceed invoice subtotal", errors={"discount": f"Discount cannot exceed subtotal ({subtotal:.2f})"})
            total_amount = round(subtotal - discount, 2)

            cur = conn.execute(
                """
                INSERT INTO sales_orders (invoice_number, customer_name, customer_contact, payment_method, status, subtotal, discount, total_amount, notes, created_by)
                VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?)
                """,
                (invoice_number, customer_name, customer_contact, payment_method, subtotal, discount, total_amount, notes, actor_username),
            )
            so_id = cur.lastrowid

            for pid, qty, price in resolved_items:
                conn.execute(
                    "INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    (so_id, pid, qty, price),
                )

            for pid, deducted_qty in qty_by_pid.items():
                prod = products_map[pid]
                new_stock = prod["current_stock"] - deducted_qty
                new_status = _compute_stock_status(new_stock, prod["min_stock"])
                conn.execute(
                    "UPDATE products SET current_stock = ?, status = ? WHERE id = ?",
                    (new_stock, new_status, pid),
                )
                conn.execute(
                    """
                    INSERT INTO movements (product_id, type, quantity, reference_no, performed_by, notes)
                    VALUES (?, 'OUTBOUND', ?, ?, ?, ?)
                    """,
                    (pid, deducted_qty, invoice_number, actor_username, f"Sale to {customer_name} ({invoice_number})"),
                )

            conn.execute(
                "INSERT INTO audit_logs (username, action, details, status) VALUES (?, 'SALE_COMPLETED', ?, 'success')",
                (actor_username, f"Invoice {invoice_number} for {customer_name}: {total_amount:.2f}"),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM sales_orders WHERE id = ?", (so_id,)).fetchone()
            return OrderService._attach_sales_items(conn, [row_to_dict(row)])[0]
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def void_sales_order(so_id, reason="", actor_username="system", db_path=None):
        reason_txt = str(reason or "").strip() or "Voided customer invoice"
        conn = get_db(db_path)
        try:
            conn.execute("BEGIN IMMEDIATE")
            so = conn.execute("SELECT * FROM sales_orders WHERE id = ?", (so_id,)).fetchone()
            if not so:
                raise OrderValidationError("Sales invoice not found", status_code=404)
            if so["status"] == "voided":
                raise OrderValidationError("Sales invoice is already voided", status_code=400)

            items = conn.execute("SELECT * FROM sales_order_items WHERE sales_order_id = ?", (so_id,)).fetchall()
            qty_by_pid = {}
            for line in items:
                qty_by_pid[line["product_id"]] = qty_by_pid.get(line["product_id"], 0) + int(line["quantity"])

            for pid, restore_qty in qty_by_pid.items():
                prod = conn.execute("SELECT * FROM products WHERE id = ?", (pid,)).fetchone()
                if prod:
                    new_stock = prod["current_stock"] + restore_qty
                    new_status = _compute_stock_status(new_stock, prod["min_stock"])
                    conn.execute(
                        "UPDATE products SET current_stock = ?, status = ? WHERE id = ?",
                        (new_stock, new_status, pid),
                    )
                    conn.execute(
                        """
                        INSERT INTO movements (product_id, type, quantity, reference_no, performed_by, notes)
                        VALUES (?, 'ADJUSTMENT', ?, ?, ?, ?)
                        """,
                        (pid, restore_qty, so["invoice_number"], actor_username, f"Voided invoice {so['invoice_number']}: {reason_txt}"),
                    )

            conn.execute("UPDATE sales_orders SET status = 'voided' WHERE id = ?", (so_id,))
            conn.execute(
                "INSERT INTO audit_logs (username, action, details, status) VALUES (?, 'SALE_VOIDED', ?, 'warning')",
                (actor_username, f"Voided invoice {so['invoice_number']}: {reason_txt}"),
            )
            conn.commit()
            return {"id": so_id, "invoice_number": so["invoice_number"], "status": "voided"}
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
