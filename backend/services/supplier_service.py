from backend.database.connection import get_db, rows_to_dict_list, row_to_dict

class SupplierService:
    @staticmethod
    def get_all(tier=None, status=None, db_path=None):
        conn = get_db(db_path)
        try:
            query = "SELECT * FROM suppliers WHERE 1=1"
            params = []
            if tier:
                query += " AND tier = ?"
                params.append(tier)
            if status:
                query += " AND status = ?"
                params.append(status)
            query += " ORDER BY tier ASC, rating DESC"
            rows = conn.execute(query, params).fetchall()
            return rows_to_dict_list(rows)
        finally:
            conn.close()

    @staticmethod
    def get_by_id(supplier_id, db_path=None):
        conn = get_db(db_path)
        try:
            row = conn.execute("SELECT * FROM suppliers WHERE id = ?", (supplier_id,)).fetchone()
            return row_to_dict(row)
        finally:
            conn.close()
