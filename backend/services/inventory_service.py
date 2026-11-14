from backend.database.connection import get_db, rows_to_dict_list

class InventoryService:
    @staticmethod
    def get_currency(conn):
        row = conn.execute("SELECT value FROM system_settings WHERE key = 'currency'").fetchone()
        return (row["value"] if row and row["value"] else "USD").strip().upper()

    @staticmethod
    def get_overview(db_path=None):
        conn = get_db(db_path)
        try:
            total_items = conn.execute("SELECT COUNT(*) as count FROM products").fetchone()["count"]
            total_stock = conn.execute("SELECT COALESCE(SUM(current_stock), 0) as total FROM products").fetchone()["total"]
            total_val = conn.execute("SELECT COALESCE(SUM(current_stock * unit_price), 0.0) as total FROM products").fetchone()["total"]
            low_stock = conn.execute("SELECT COUNT(*) as count FROM products WHERE current_stock <= min_stock AND current_stock > 0").fetchone()["count"]
            out_of_stock = conn.execute("SELECT COUNT(*) as count FROM products WHERE current_stock = 0").fetchone()["count"]
            currency = InventoryService.get_currency(conn)
            return {
                "total_items": total_items,
                "total_stock": total_stock,
                "total_value": round(total_val, 2),
                "low_stock_count": low_stock,
                "out_of_stock_count": out_of_stock,
                "currency": currency,
            }
        finally:
            conn.close()

    @staticmethod
    def get_alerts(db_path=None):
        conn = get_db(db_path)
        try:
            rows = conn.execute(
                """
                SELECT p.*, s.name as supplier_name
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                WHERE p.current_stock <= p.min_stock
                ORDER BY
                    CASE WHEN p.current_stock = 0 THEN 0 ELSE 1 END ASC,
                    (p.min_stock - p.current_stock) DESC,
                    p.current_stock ASC,
                    p.name ASC
                """
            ).fetchall()
            alerts = rows_to_dict_list(rows)
            for item in alerts:
                curr = int(item.get("current_stock") or 0)
                min_s = int(item.get("min_stock") or 0)
                max_s = int(item.get("max_stock") or 0)
                if max_s > curr:
                    suggested = max_s - curr
                else:
                    suggested = max(1, (min_s * 2) - curr)
                item["suggested_reorder"] = max(1, suggested)
            return alerts
        finally:
            conn.close()
