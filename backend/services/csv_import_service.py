import csv
import io
from datetime import datetime
from backend.database.connection import get_db
from backend.utils.responses import success_response, error_response
from backend.utils.validators import is_valid_email

VALID_MODES = {"upsert", "skip", "replace"}
REPLACE_ALLOWED_ROLES = {"admin", "manager", "shopkeeper"}


def _normalize_header(name):
    return str(name or "").strip().lower().replace(" ", "_").replace("-", "_")


def _parse_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in ("1", "true", "yes", "y", "on"):
        return True
    if text in ("0", "false", "no", "n", "off"):
        return False
    return default


def _compute_stock_status(current_stock, min_stock):
    if current_stock == 0:
        return "out_of_stock"
    if current_stock <= min_stock:
        return "low_stock"
    return "in_stock"


def parse_csv_request(req):
    """Extract normalized CSV rows and import options from multipart or JSON request."""
    csv_text = None
    options = {}

    if req.files and "file" in req.files:
        uploaded = req.files["file"]
        raw_bytes = uploaded.read()
        if not raw_bytes:
            return None, options, "Uploaded CSV file is empty"
        try:
            csv_text = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            csv_text = raw_bytes.decode("latin-1")
        options = {
            "mode": (req.form.get("mode") or "upsert").strip().lower(),
            "apply_stock": _parse_bool(req.form.get("apply_stock"), default=True),
        }
    else:
        payload = req.get_json(silent=True) or {}
        csv_text = payload.get("csv_text")
        options = {
            "mode": str(payload.get("mode") or "upsert").strip().lower(),
            "apply_stock": _parse_bool(payload.get("apply_stock"), default=True),
        }

    if not csv_text or not str(csv_text).strip():
        return None, options, "CSV file or csv_text payload is required"

    if options["mode"] not in VALID_MODES:
        return None, options, f"Invalid import mode '{options['mode']}'. Must be upsert, skip, or replace"

    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames:
        return None, options, "CSV file is missing a header row"

    norm_fields = [_normalize_header(f) for f in reader.fieldnames]
    rows = []
    for idx, raw_row in enumerate(reader, start=2):
        # Ignore completely blank trailing lines
        if not any(str(v or "").strip() for v in raw_row.values() if v is not None):
            continue
        norm_row = {}
        for orig_key, norm_key in zip(reader.fieldnames, norm_fields):
            if norm_key:
                val = raw_row.get(orig_key)
                norm_row[norm_key] = val.strip() if isinstance(val, str) else val
        rows.append((idx, norm_row))

    if not rows:
        return None, options, "CSV file contains no data rows"

    return rows, options, None


def check_replace_permission(user, mode):
    if mode != "replace":
        return None
    role = (user or {}).get("role", "").lower()
    if role not in REPLACE_ALLOWED_ROLES:
        return "Insufficient permissions to replace existing store records"
    return None


def handle_csv_import_route(req, entity_label, importer_fn, db_path=None):
    """Shared Flask route handler for CSV bulk import endpoints."""
    rows, options, parse_err = parse_csv_request(req)
    if parse_err:
        return error_response(parse_err, status_code=400)

    user = getattr(req, "current_user", None)
    perm_err = check_replace_permission(user, options["mode"])
    if perm_err:
        return error_response(perm_err, status_code=403)

    actor = user.get("username") if user else "system"
    try:
        summary = importer_fn(rows, options, actor, db_path)
        return success_response(
            data=summary,
            message=f"Imported {summary['inserted']} new and {summary['updated']} updated {entity_label}",
            status_code=201,
        )
    except ValueError as e:
        return error_response(str(e), status_code=400)
    except Exception as e:
        return error_response(f"Failed to import {entity_label} CSV: {str(e)}", status_code=500)


def _pick(row, *keys, default=None):
    for key in keys:
        val = row.get(key)
        if val is not None and str(val).strip() != "":
            return str(val).strip()
    return default


def _clean_num(val):
    return str(val).replace(",", "").replace("₹", "").replace("$", "").strip()


def _require_columns(rows, required_groups):
    sample_keys = set(rows[0][1].keys())
    missing = []
    for group in required_groups:
        if not any(k in sample_keys for k in group):
            missing.append(group[0])
    if missing:
        return f"CSV missing required column(s): {', '.join(missing)}"
    return None


def _insert_movement(conn, product_id, m_type, quantity, reference_no, performed_by, notes, created_at=None):
    if created_at:
        conn.execute(
            """
            INSERT INTO movements (product_id, type, quantity, reference_no, performed_by, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (product_id, m_type, quantity, reference_no, performed_by, notes, created_at)
        )
    else:
        conn.execute(
            """
            INSERT INTO movements (product_id, type, quantity, reference_no, performed_by, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (product_id, m_type, quantity, reference_no, performed_by, notes)
        )


class CsvImportService:
    @staticmethod
    def import_suppliers(rows, mode="upsert", actor_username="system", db_path=None):
        header_err = _require_columns(rows, [("code", "supplier_code"), ("name", "supplier_name")])
        if header_err:
            raise ValueError(header_err)

        inserted = 0
        updated = 0
        skipped = 0
        errors = []

        conn = get_db(db_path)
        try:
            conn.execute("BEGIN IMMEDIATE")
            if mode == "replace":
                conn.execute("DELETE FROM suppliers")

            for line_no, row in rows:
                conn.execute("SAVEPOINT row_sp")
                try:
                    code = (_pick(row, "code", "supplier_code") or "").upper()
                    name = _pick(row, "name", "supplier_name") or ""
                    if not code or not name:
                        raise ValueError("code and name are required")

                    tier = _pick(row, "tier", default="Tier B")
                    if tier not in ("Tier A", "Tier B", "Tier C"):
                        raise ValueError(f"invalid tier '{tier}'")

                    contact_name = _pick(row, "contact_name", "contact_person", "contact", default="")
                    email = _pick(row, "email", default="")
                    if email and not is_valid_email(email):
                        raise ValueError(f"invalid email '{email}'")

                    phone = _pick(row, "phone", default="")
                    lead_time = int(_pick(row, "lead_time_days", "lead_time", default="7"))
                    if lead_time < 0:
                        raise ValueError("lead_time_days cannot be negative")

                    rating = float(_pick(row, "rating", default="4.5"))
                    if rating < 0.0 or rating > 5.0:
                        raise ValueError("rating must be between 0.0 and 5.0")

                    status = (_pick(row, "status", default="active")).lower()
                    if status not in ("active", "inactive"):
                        raise ValueError("status must be active or inactive")

                    existing = conn.execute("SELECT id FROM suppliers WHERE code = ?", (code,)).fetchone()
                    if existing:
                        if mode == "skip":
                            skipped += 1
                        else:
                            conn.execute(
                                """
                                UPDATE suppliers
                                SET name = ?, tier = ?, contact_name = ?, email = ?, phone = ?,
                                    lead_time_days = ?, rating = ?, status = ?
                                WHERE id = ?
                                """,
                                (name, tier, contact_name, email, phone, lead_time, rating, status, existing["id"])
                            )
                            updated += 1
                    else:
                        conn.execute(
                            """
                            INSERT INTO suppliers (code, name, tier, contact_name, email, phone, lead_time_days, rating, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (code, name, tier, contact_name, email, phone, lead_time, rating, status)
                        )
                        inserted += 1
                    conn.execute("RELEASE SAVEPOINT row_sp")
                except Exception as exc:
                    conn.execute("ROLLBACK TO SAVEPOINT row_sp")
                    conn.execute("RELEASE SAVEPOINT row_sp")
                    errors.append({"row": line_no, "error": str(exc)})

            if inserted + updated + skipped == 0 and errors:
                conn.rollback()
                raise ValueError(f"Import failed: {errors[0]['error']} (row {errors[0]['row']})")

            conn.execute(
                """
                INSERT INTO audit_logs (username, action, details, status)
                VALUES (?, 'SUPPLIERS_IMPORTED', ?, 'success')
                """,
                (actor_username, f"CSV import ({mode}): {inserted} inserted, {updated} updated, {skipped} skipped, {len(errors)} errors")
            )
            conn.commit()
            return {
                "inserted": inserted,
                "updated": updated,
                "skipped": skipped,
                "error_count": len(errors),
                "errors": errors[:25],
                "total_rows": len(rows)
            }
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def import_products(rows, mode="upsert", actor_username="system", db_path=None):
        header_err = _require_columns(rows, [("sku",), ("name", "product_name")])
        if header_err:
            raise ValueError(header_err)

        inserted = 0
        updated = 0
        skipped = 0
        suppliers_created = 0
        errors = []

        conn = get_db(db_path)
        try:
            conn.execute("BEGIN IMMEDIATE")
            if mode == "replace":
                conn.execute("DELETE FROM products")

            # Cache suppliers by upper code and lower name to keep bulk imports fast
            supp_by_code = {}
            supp_by_name = {}
            supp_ids = set()
            for s in conn.execute("SELECT id, code, name FROM suppliers").fetchall():
                supp_by_code[s["code"].upper()] = s["id"]
                supp_by_name[s["name"].strip().lower()] = s["id"]
                supp_ids.add(s["id"])

            for line_no, row in rows:
                conn.execute("SAVEPOINT row_sp")
                try:
                    sku = (_pick(row, "sku") or "").upper()
                    name = _pick(row, "name", "product_name") or ""
                    if not sku or not name:
                        raise ValueError("sku and name are required")

                    category = _pick(row, "category", default="General")
                    unit_price = float(_clean_num(_pick(row, "unit_price", "price", default="0")))
                    current_stock = int(float(_clean_num(_pick(row, "current_stock", "stock", "quantity", default="0"))))
                    min_stock = int(float(_clean_num(_pick(row, "min_stock", "minimum_stock", default="10"))))
                    max_stock = int(float(_clean_num(_pick(row, "max_stock", "maximum_stock", default="500"))))

                    if unit_price < 0:
                        raise ValueError("unit_price cannot be negative")
                    if current_stock < 0:
                        raise ValueError("current_stock cannot be negative")
                    if min_stock < 0 or max_stock < min_stock:
                        raise ValueError("invalid min_stock/max_stock thresholds")

                    supplier_id = None
                    supp_code = _pick(row, "supplier_code")
                    supp_name = _pick(row, "supplier_name", "supplier")
                    raw_supp_id = _pick(row, "supplier_id")

                    if supp_code:
                        code_key = supp_code.upper()
                        supplier_id = supp_by_code.get(code_key)
                        if supplier_id is None:
                            cur_s = conn.execute(
                                """
                                INSERT INTO suppliers (code, name, tier, status)
                                VALUES (?, ?, 'Tier A', 'active')
                                """,
                                (code_key, supp_name or code_key)
                            )
                            supplier_id = cur_s.lastrowid
                            supp_by_code[code_key] = supplier_id
                            supp_by_name[(supp_name or code_key).lower()] = supplier_id
                            supp_ids.add(supplier_id)
                            suppliers_created += 1
                    elif raw_supp_id and raw_supp_id.isdigit() and int(raw_supp_id) in supp_ids:
                        supplier_id = int(raw_supp_id)
                    elif supp_name:
                        supplier_id = supp_by_name.get(supp_name.lower())
                        if supplier_id is None:
                            gen_code = "SUP-" + "".join(ch for ch in supp_name.upper() if ch.isalnum())[:12]
                            base_code = gen_code
                            suffix = 1
                            while gen_code in supp_by_code:
                                suffix += 1
                                gen_code = f"{base_code}-{suffix}"
                            cur_s = conn.execute(
                                """
                                INSERT INTO suppliers (code, name, tier, status)
                                VALUES (?, ?, 'Tier B', 'active')
                                """,
                                (gen_code, supp_name)
                            )
                            supplier_id = cur_s.lastrowid
                            supp_by_code[gen_code] = supplier_id
                            supp_by_name[supp_name.lower()] = supplier_id
                            supp_ids.add(supplier_id)
                            suppliers_created += 1

                    status = _compute_stock_status(current_stock, min_stock)

                    existing = conn.execute("SELECT id FROM products WHERE sku = ?", (sku,)).fetchone()
                    if existing:
                        if mode == "skip":
                            skipped += 1
                        else:
                            conn.execute(
                                """
                                UPDATE products
                                SET name = ?, category = ?, unit_price = ?, current_stock = ?,
                                    min_stock = ?, max_stock = ?, supplier_id = ?, status = ?
                                WHERE id = ?
                                """,
                                (name, category, unit_price, current_stock, min_stock, max_stock, supplier_id, status, existing["id"])
                            )
                            updated += 1
                    else:
                        conn.execute(
                            """
                            INSERT INTO products (sku, name, category, unit_price, current_stock, min_stock, max_stock, supplier_id, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (sku, name, category, unit_price, current_stock, min_stock, max_stock, supplier_id, status)
                        )
                        inserted += 1
                    conn.execute("RELEASE SAVEPOINT row_sp")
                except Exception as exc:
                    conn.execute("ROLLBACK TO SAVEPOINT row_sp")
                    conn.execute("RELEASE SAVEPOINT row_sp")
                    errors.append({"row": line_no, "error": str(exc)})

            if inserted + updated + skipped == 0 and errors:
                conn.rollback()
                raise ValueError(f"Import failed: {errors[0]['error']} (row {errors[0]['row']})")

            conn.execute(
                """
                INSERT INTO audit_logs (username, action, details, status)
                VALUES (?, 'PRODUCTS_IMPORTED', ?, 'success')
                """,
                (actor_username, f"CSV import ({mode}): {inserted} inserted, {updated} updated, {skipped} skipped, {suppliers_created} suppliers linked, {len(errors)} errors")
            )
            conn.commit()
            return {
                "inserted": inserted,
                "updated": updated,
                "skipped": skipped,
                "suppliers_created": suppliers_created,
                "error_count": len(errors),
                "errors": errors[:25],
                "total_rows": len(rows)
            }
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def import_movements(rows, mode="upsert", apply_stock=True, actor_username="system", db_path=None):
        header_err = _require_columns(rows, [("sku", "product_id", "product_sku"), ("type",), ("quantity",)])
        if header_err:
            raise ValueError(header_err)

        inserted = 0
        errors = []

        conn = get_db(db_path)
        try:
            conn.execute("BEGIN IMMEDIATE")
            if mode == "replace":
                conn.execute("DELETE FROM movements")

            products_by_sku = {}
            products_by_id = {}
            for p in conn.execute("SELECT id, sku, current_stock, min_stock FROM products").fetchall():
                item = dict(p)
                products_by_sku[item["sku"].upper()] = item
                products_by_id[item["id"]] = item

            for line_no, row in rows:
                conn.execute("SAVEPOINT row_sp")
                try:
                    sku = (_pick(row, "sku", "product_sku") or "").upper()
                    raw_pid = _pick(row, "product_id")
                    prod = products_by_sku.get(sku) if sku else None
                    if not prod and raw_pid and raw_pid.isdigit():
                        prod = products_by_id.get(int(raw_pid))
                    if not prod:
                        raise ValueError(f"product not found for SKU '{sku or raw_pid}'")

                    m_type = (_pick(row, "type") or "").upper()
                    if m_type not in ("INBOUND", "OUTBOUND", "ADJUSTMENT", "TRANSFER"):
                        raise ValueError(f"invalid movement type '{m_type}'")

                    quantity = int(float(_pick(row, "quantity") or "0"))
                    if quantity == 0:
                        raise ValueError("quantity cannot be zero")
                    if m_type in ("INBOUND", "OUTBOUND", "TRANSFER") and quantity < 0:
                        raise ValueError(f"quantity for {m_type} must be positive")

                    reference_no = _pick(row, "reference_no", "reference", default="")
                    performed_by = _pick(row, "performed_by", default=actor_username)
                    notes = _pick(row, "notes", default="")
                    created_at = _pick(row, "created_at")
                    if created_at:
                        # Validate timestamp format loosely via ISO parsing
                        datetime.fromisoformat(created_at.replace("Z", "+00:00").replace(" ", "T"))

                    target_sku = (_pick(row, "target_sku") or "").upper()
                    raw_target_id = _pick(row, "target_product_id")
                    target_prod = None
                    if m_type == "TRANSFER":
                        target_prod = products_by_sku.get(target_sku) if target_sku else None
                        if not target_prod and raw_target_id and raw_target_id.isdigit():
                            target_prod = products_by_id.get(int(raw_target_id))
                        if not target_prod:
                            raise ValueError(f"transfer destination product not found ('{target_sku or raw_target_id}')")
                        if target_prod["id"] == prod["id"]:
                            raise ValueError("cannot transfer to the same product")

                    record_qty = quantity if m_type == "ADJUSTMENT" else abs(quantity)
                    pending_stock_updates = []
                    if apply_stock:
                        curr = prod["current_stock"]
                        norm_qty = abs(quantity)
                        if m_type == "INBOUND":
                            new_stock = curr + norm_qty
                        elif m_type == "OUTBOUND":
                            if curr < norm_qty:
                                raise ValueError(f"insufficient stock for {prod['sku']} ({curr} < {norm_qty})")
                            new_stock = curr - norm_qty
                        elif m_type == "ADJUSTMENT":
                            if curr + quantity < 0:
                                raise ValueError(f"adjustment would make {prod['sku']} stock negative")
                            new_stock = curr + quantity
                        elif m_type == "TRANSFER":
                            if curr < norm_qty:
                                raise ValueError(f"insufficient stock for transfer of {prod['sku']} ({curr} < {norm_qty})")
                            new_stock = curr - norm_qty
                            target_new_stock = target_prod["current_stock"] + norm_qty
                            target_status = _compute_stock_status(target_new_stock, target_prod["min_stock"])
                            conn.execute(
                                "UPDATE products SET current_stock = ?, status = ? WHERE id = ?",
                                (target_new_stock, target_status, target_prod["id"])
                            )
                            pending_stock_updates.append((target_prod, target_new_stock))
                            _insert_movement(
                                conn,
                                target_prod["id"],
                                "INBOUND",
                                norm_qty,
                                reference_no or f"TRF-FROM-{prod['sku']}",
                                performed_by,
                                f"Transferred from SKU {prod['sku']}",
                                created_at,
                            )

                        new_status = _compute_stock_status(new_stock, prod["min_stock"])
                        conn.execute(
                            "UPDATE products SET current_stock = ?, status = ? WHERE id = ?",
                            (new_stock, new_status, prod["id"])
                        )
                        pending_stock_updates.append((prod, new_stock))

                    _insert_movement(conn, prod["id"], m_type, record_qty, reference_no, performed_by, notes, created_at)
                    for cached_prod, updated_stock in pending_stock_updates:
                        cached_prod["current_stock"] = updated_stock
                    inserted += 1
                    conn.execute("RELEASE SAVEPOINT row_sp")
                except Exception as exc:
                    conn.execute("ROLLBACK TO SAVEPOINT row_sp")
                    conn.execute("RELEASE SAVEPOINT row_sp")
                    errors.append({"row": line_no, "error": str(exc)})

            if inserted == 0 and errors:
                conn.rollback()
                raise ValueError(f"Import failed: {errors[0]['error']} (row {errors[0]['row']})")

            conn.execute(
                """
                INSERT INTO audit_logs (username, action, details, status)
                VALUES (?, 'MOVEMENTS_IMPORTED', ?, 'success')
                """,
                (actor_username, f"CSV import ({mode}, apply_stock={apply_stock}): {inserted} inserted, {len(errors)} errors")
            )
            conn.commit()
            return {
                "inserted": inserted,
                "updated": 0,
                "skipped": 0,
                "apply_stock": apply_stock,
                "error_count": len(errors),
                "errors": errors[:25],
                "total_rows": len(rows)
            }
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
