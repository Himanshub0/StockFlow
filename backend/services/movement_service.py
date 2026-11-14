from datetime import date
from backend.database.connection import get_db, rows_to_dict_list


class MovementService:
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
    def _build_where(m_type=None, search=None, start_date=None, end_date=None):
        start_iso = MovementService._validate_iso_date(start_date, "start_date")
        end_iso = MovementService._validate_iso_date(end_date, "end_date")
        if start_iso and end_iso and start_iso > end_iso:
            raise ValueError("Start date cannot be after end date.")

        where_sql = " WHERE 1=1"
        params = []
        if m_type and m_type != "all":
            where_sql += " AND m.type = ?"
            params.append(m_type.upper())
        if search:
            term = f"%{search.strip().lower()}%"
            where_sql += " AND (LOWER(p.name) LIKE ? OR LOWER(p.sku) LIKE ? OR LOWER(COALESCE(m.reference_no, '')) LIKE ? OR LOWER(COALESCE(m.notes, '')) LIKE ?)"
            params.extend([term, term, term, term])
        if start_iso:
            where_sql += " AND date(m.created_at) >= ?"
            params.append(start_iso)
        if end_iso:
            where_sql += " AND date(m.created_at) <= ?"
            params.append(end_iso)
        return where_sql, params

    @staticmethod
    def get_recent(limit=50, offset=0, m_type=None, search=None, start_date=None, end_date=None, db_path=None):
        where_sql, params = MovementService._build_where(
            m_type=m_type, search=search, start_date=start_date, end_date=end_date
        )
        conn = get_db(db_path)
        try:
            query_params = list(params)
            limit_clause = ""
            if limit is not None:
                limit_clause = " LIMIT ? OFFSET ?"
                query_params.extend([limit, offset])

            rows = conn.execute(
                f"""
                SELECT m.*, p.name as product_name, p.sku as product_sku
                FROM movements m
                JOIN products p ON m.product_id = p.id
                {where_sql}
                ORDER BY m.created_at DESC, m.id DESC
                {limit_clause}
                """,
                query_params,
            ).fetchall()
            return rows_to_dict_list(rows)
        finally:
            conn.close()

    @staticmethod
    def get_counts(m_type=None, search=None, start_date=None, end_date=None, db_path=None):
        where_sql, params = MovementService._build_where(
            m_type=m_type, search=search, start_date=start_date, end_date=end_date
        )
        conn = get_db(db_path)
        try:
            total = conn.execute("SELECT COUNT(*) as count FROM movements").fetchone()["count"]
            filtered_total = conn.execute(
                f"SELECT COUNT(*) as count FROM movements m JOIN products p ON m.product_id = p.id {where_sql}",
                params,
            ).fetchone()["count"]
            return total, filtered_total
        finally:
            conn.close()
