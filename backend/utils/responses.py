import csv
import io
from flask import Response, jsonify


def success_response(data=None, message="Operation successful", status_code=200, **kwargs):
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    payload.update(kwargs)
    return jsonify(payload), status_code


def error_response(message="An error occurred", status_code=400, errors=None):
    payload = {
        "success": False,
        "error": message,
        "status_code": status_code
    }
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status_code


def _csv_safe_cell(val):
    if val is None:
        return ""
    if isinstance(val, (int, float)):
        return str(val)
    text = str(val)
    if text and text[0] in ("=", "+", "@", "\t", "\r", "-"):
        try:
            float(text)
            return text
        except ValueError:
            return f"'{text}"
    return text


def rows_to_csv_response(filename, header, rows):
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\r\n")
    writer.writerow(header)
    for row in rows:
        writer.writerow([_csv_safe_cell(cell) for cell in row])
    return Response(
        buf.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
