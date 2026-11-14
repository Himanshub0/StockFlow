from backend.database.connection import get_db

class UsageService:
    @staticmethod
    def record_event(event_type, details=None, ip_address="127.0.0.1", db_path=None):
        conn = get_db(db_path)
        try:
            conn.execute(
                """
                INSERT INTO audit_logs (username, action, details, ip_address, status)
                VALUES ('telemetry', ?, ?, ?, 'success')
                """,
                (event_type or "TELEMETRY", str(details or ""), ip_address or "127.0.0.1")
            )
            conn.commit()
            return {"event": event_type, "status": "recorded"}
        finally:
            conn.close()
