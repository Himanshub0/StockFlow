from datetime import date
from backend.database.connection import get_db, rows_to_dict_list
from backend.services.inventory_service import InventoryService

class ReportService:
    @staticmethod
    def _validate_iso_date(val, label):
        if not val:
            return None
        text = str(val).strip()
        try:
            date.fromisoformat(text)
            return text
        except ValueError:
            raise ValueError(f"Invalid {label} format '{text}'. Expected YYYY-MM-DD.")

    @staticmethod
    def get_summary(db_path=None, start_date=None, end_date=None, category=None):
        start_iso = ReportService._validate_iso_date(start_date, "start_date")
        end_iso = ReportService._validate_iso_date(end_date, "end_date")
        if start_iso and end_iso and start_iso > end_iso:
            raise ValueError("Start date cannot be after end date.")
        cat_filter = str(category).strip() if category and str(category).strip() != "all" else None

        conn = get_db(db_path)
        try:
            prod_where = " WHERE 1=1"
            prod_params = []
            if cat_filter:
                prod_where += " AND category = ?"
                prod_params.append(cat_filter)

            category_breakdown = conn.execute(
                f"""
                SELECT category, COUNT(*) as product_count, COALESCE(SUM(current_stock), 0) as total_units, COALESCE(SUM(current_stock * unit_price), 0.0) as total_value
                FROM products
                {prod_where}
                GROUP BY category
                ORDER BY total_value DESC
                """,
                prod_params
            ).fetchall()

            mov_where = " WHERE 1=1"
            mov_params = []
            if cat_filter:
                mov_where += " AND p.category = ?"
                mov_params.append(cat_filter)
            if start_iso:
                mov_where += " AND date(m.created_at) >= ?"
                mov_params.append(start_iso)
            if end_iso:
                mov_where += " AND date(m.created_at) <= ?"
                mov_params.append(end_iso)

            movement_trends = conn.execute(
                f"""
                SELECT m.type, COUNT(*) as count, COALESCE(SUM(m.quantity), 0) as net_quantity
                FROM movements m
                JOIN products p ON m.product_id = p.id
                {mov_where}
                GROUP BY m.type
                """,
                mov_params
            ).fetchall()

            supp_where = ""
            supp_params = []
            if cat_filter:
                supp_where = " AND p.category = ?"
                supp_params.append(cat_filter)

            supplier_performance = conn.execute(
                f"""
                SELECT s.tier, COUNT(p.id) as managed_products, ROUND(AVG(s.rating), 2) as avg_rating
                FROM suppliers s
                LEFT JOIN products p ON s.id = p.supplier_id {supp_where}
                GROUP BY s.tier
                ORDER BY s.tier ASC
                """,
                supp_params
            ).fetchall()

            totals_row = conn.execute(
                f"""
                SELECT COUNT(*) as total_products, COALESCE(SUM(current_stock), 0) as total_units, COALESCE(SUM(current_stock * unit_price), 0.0) as total_value
                FROM products
                {prod_where}
                """,
                prod_params
            ).fetchone()

            total_movements_row = conn.execute(
                f"""
                SELECT COUNT(*) as total_movements
                FROM movements m
                JOIN products p ON m.product_id = p.id
                {mov_where}
                """,
                mov_params
            ).fetchone()

            available_categories = [
                r["category"]
                for r in conn.execute("SELECT DISTINCT category FROM products ORDER BY category ASC").fetchall()
            ]
            currency = InventoryService.get_currency(conn)

            # Real Sales & Billing summary (only completed invoices, honoring date and category filters)
            so_where = " WHERE so.status = 'completed'"
            so_params = []
            if start_iso:
                so_where += " AND date(so.created_at) >= ?"
                so_params.append(start_iso)
            if end_iso:
                so_where += " AND date(so.created_at) <= ?"
                so_params.append(end_iso)

            if cat_filter:
                sales_row = conn.execute(
                    f"""
                    SELECT COUNT(DISTINCT so.id) as total_orders,
                           COALESCE(SUM(soi.quantity * soi.unit_price), 0.0) as gross_revenue,
                           0.0 as total_discounts,
                           COALESCE(SUM(soi.quantity * soi.unit_price), 0.0) as net_revenue,
                           COALESCE(SUM(soi.quantity), 0) as units_sold
                    FROM sales_orders so
                    JOIN sales_order_items soi ON soi.sales_order_id = so.id
                    JOIN products p ON p.id = soi.product_id
                    {so_where} AND p.category = ?
                    """,
                    so_params + [cat_filter],
                ).fetchone()
            else:
                sales_head = conn.execute(
                    f"""
                    SELECT COUNT(*) as total_orders,
                           COALESCE(SUM(so.subtotal), 0.0) as gross_revenue,
                           COALESCE(SUM(so.discount), 0.0) as total_discounts,
                           COALESCE(SUM(so.total_amount), 0.0) as net_revenue
                    FROM sales_orders so
                    {so_where}
                    """,
                    so_params,
                ).fetchone()
                units_row = conn.execute(
                    f"""
                    SELECT COALESCE(SUM(soi.quantity), 0) as units_sold
                    FROM sales_order_items soi
                    JOIN sales_orders so ON so.id = soi.sales_order_id
                    {so_where}
                    """,
                    so_params,
                ).fetchone()
                sales_row = {
                    "total_orders": sales_head["total_orders"],
                    "gross_revenue": sales_head["gross_revenue"],
                    "total_discounts": sales_head["total_discounts"],
                    "net_revenue": sales_head["net_revenue"],
                    "units_sold": units_row["units_sold"],
                }

            # Real Purchase Orders summary
            po_where = " WHERE 1=1"
            po_params = []
            if start_iso:
                po_where += " AND date(po.created_at) >= ?"
                po_params.append(start_iso)
            if end_iso:
                po_where += " AND date(po.created_at) <= ?"
                po_params.append(end_iso)

            if cat_filter:
                po_row = conn.execute(
                    f"""
                    SELECT COUNT(DISTINCT po.id) as total_orders,
                           COUNT(DISTINCT CASE WHEN po.status = 'ordered' THEN po.id END) as ordered_count,
                           COUNT(DISTINCT CASE WHEN po.status = 'received' THEN po.id END) as received_count,
                           COALESCE(SUM(CASE WHEN po.status != 'cancelled' THEN poi.quantity * poi.unit_cost ELSE 0 END), 0.0) as total_spend
                    FROM purchase_orders po
                    JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
                    JOIN products p ON p.id = poi.product_id
                    {po_where} AND p.category = ?
                    """,
                    po_params + [cat_filter],
                ).fetchone()
            else:
                po_row = conn.execute(
                    f"""
                    SELECT COUNT(*) as total_orders,
                           COUNT(CASE WHEN po.status = 'ordered' THEN 1 END) as ordered_count,
                           COUNT(CASE WHEN po.status = 'received' THEN 1 END) as received_count,
                           COALESCE(SUM(CASE WHEN po.status != 'cancelled' THEN po.total_cost ELSE 0 END), 0.0) as total_spend
                    FROM purchase_orders po
                    {po_where}
                    """,
                    po_params,
                ).fetchone()

            return {
                "categories": rows_to_dict_list(category_breakdown),
                "movements": rows_to_dict_list(movement_trends),
                "supplier_performance": rows_to_dict_list(supplier_performance),
                "available_categories": available_categories,
                "currency": currency,
                "filters": {
                    "start_date": start_iso,
                    "end_date": end_iso,
                    "category": cat_filter or "all",
                },
                "totals": {
                    "total_products": totals_row["total_products"],
                    "total_units": totals_row["total_units"],
                    "total_value": round(float(totals_row["total_value"] or 0.0), 2),
                    "total_movements": total_movements_row["total_movements"],
                },
                "sales_summary": {
                    "total_orders": int(sales_row["total_orders"] or 0),
                    "gross_revenue": round(float(sales_row["gross_revenue"] or 0.0), 2),
                    "total_discounts": round(float(sales_row["total_discounts"] or 0.0), 2),
                    "net_revenue": round(float(sales_row["net_revenue"] or 0.0), 2),
                    "units_sold": int(sales_row["units_sold"] or 0),
                },
                "purchase_summary": {
                    "total_orders": int(po_row["total_orders"] or 0),
                    "ordered_count": int(po_row["ordered_count"] or 0),
                    "received_count": int(po_row["received_count"] or 0),
                    "total_spend": round(float(po_row["total_spend"] or 0.0), 2),
                },
            }
        finally:
            conn.close()
