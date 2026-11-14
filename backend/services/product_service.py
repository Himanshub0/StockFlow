from backend.database.connection import get_db, rows_to_dict_list, row_to_dict

class ProductService:
    @staticmethod
    def get_all(category=None, status=None, db_path=None):
        conn = get_db(db_path)
        try:
            query = """
                SELECT p.*, s.name as supplier_name, s.code as supplier_code
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                WHERE 1=1
            """
            params = []
            if category:
                query += " AND p.category = ?"
                params.append(category)
            if status:
                query += " AND p.status = ?"
                params.append(status)
            query += " ORDER BY p.id DESC"
            rows = conn.execute(query, params).fetchall()
            return rows_to_dict_list(rows)
        finally:
            conn.close()

    @staticmethod
    def get_by_id(product_id, db_path=None):
        conn = get_db(db_path)
        try:
            row = conn.execute(
                """
                SELECT p.*, s.name as supplier_name, s.code as supplier_code
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                WHERE p.id = ?
                """,
                (product_id,)
            ).fetchone()
            return row_to_dict(row)
        finally:
            conn.close()
