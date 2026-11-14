from flask import Blueprint, request, current_app
from backend.services.order_service import OrderService, OrderValidationError
from backend.utils.responses import success_response, error_response
from backend.utils.auth import require_auth

orders_bp = Blueprint("orders", __name__, url_prefix="/api")


def get_target_db():
    return current_app.config.get("DATABASE_PATH")


@orders_bp.route("/purchase-orders", methods=["GET"])
@require_auth()
def list_purchase_orders():
    try:
        limit = min(max(request.args.get("limit", default=25, type=int), 1), 500)
        offset = max(request.args.get("offset", default=0, type=int), 0)
        status = request.args.get("status")
        search = request.args.get("search")
        data = OrderService.list_purchase_orders(
            limit=limit, offset=offset, status=status, search=search, db_path=get_target_db()
        )
        return success_response(data=data)
    except Exception as e:
        return error_response(f"Failed to fetch purchase orders: {str(e)}", status_code=500)


@orders_bp.route("/purchase-orders", methods=["POST"])
@require_auth()
def create_purchase_order():
    data = request.get_json(silent=True) or {}
    actor = getattr(request, "current_user", {}) or {}
    try:
        po = OrderService.create_purchase_order(
            data, actor_username=actor.get("username", "user"), db_path=get_target_db()
        )
        return success_response(data={"purchase_order": po}, message=f"Purchase order {po['po_number']} created", status_code=201)
    except OrderValidationError as e:
        return error_response(str(e), status_code=e.status_code, errors=e.errors)
    except Exception as e:
        return error_response(f"Failed to create purchase order: {str(e)}", status_code=500)


@orders_bp.route("/purchase-orders/<int:po_id>/receive", methods=["POST"])
@require_auth()
def receive_purchase_order(po_id):
    actor = getattr(request, "current_user", {}) or {}
    try:
        po = OrderService.receive_purchase_order(
            po_id, actor_username=actor.get("username", "user"), db_path=get_target_db()
        )
        return success_response(data={"purchase_order": po}, message=f"Purchase order {po['po_number']} received into stock")
    except OrderValidationError as e:
        return error_response(str(e), status_code=e.status_code, errors=e.errors)
    except Exception as e:
        return error_response(f"Failed to receive purchase order: {str(e)}", status_code=500)


@orders_bp.route("/purchase-orders/<int:po_id>/cancel", methods=["POST"])
@require_auth(roles=["admin", "manager", "shopkeeper"])
def cancel_purchase_order(po_id):
    actor = getattr(request, "current_user", {}) or {}
    try:
        res = OrderService.cancel_purchase_order(
            po_id, actor_username=actor.get("username", "user"), db_path=get_target_db()
        )
        return success_response(data=res, message=f"Purchase order {res['po_number']} cancelled")
    except OrderValidationError as e:
        return error_response(str(e), status_code=e.status_code, errors=e.errors)
    except Exception as e:
        return error_response(f"Failed to cancel purchase order: {str(e)}", status_code=500)


@orders_bp.route("/sales-orders", methods=["GET"])
@require_auth()
def list_sales_orders():
    try:
        limit = min(max(request.args.get("limit", default=25, type=int), 1), 500)
        offset = max(request.args.get("offset", default=0, type=int), 0)
        status = request.args.get("status")
        search = request.args.get("search")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        data = OrderService.list_sales_orders(
            limit=limit, offset=offset, status=status, search=search,
            start_date=start_date, end_date=end_date, db_path=get_target_db(),
        )
        return success_response(data=data)
    except OrderValidationError as e:
        return error_response(str(e), status_code=e.status_code, errors=e.errors)
    except Exception as e:
        return error_response(f"Failed to fetch sales orders: {str(e)}", status_code=500)


@orders_bp.route("/sales-orders", methods=["POST"])
@require_auth()
def create_sales_order():
    data = request.get_json(silent=True) or {}
    actor = getattr(request, "current_user", {}) or {}
    try:
        so = OrderService.create_sales_order(
            data, actor_username=actor.get("username", "user"), db_path=get_target_db()
        )
        return success_response(data={"sales_order": so}, message=f"Invoice {so['invoice_number']} completed", status_code=201)
    except OrderValidationError as e:
        return error_response(str(e), status_code=e.status_code, errors=e.errors)
    except Exception as e:
        return error_response(f"Failed to create sales invoice: {str(e)}", status_code=500)


@orders_bp.route("/sales-orders/<int:so_id>/void", methods=["POST"])
@require_auth(roles=["admin", "manager", "shopkeeper"])
def void_sales_order(so_id):
    data = request.get_json(silent=True) or {}
    actor = getattr(request, "current_user", {}) or {}
    try:
        res = OrderService.void_sales_order(
            so_id, reason=data.get("reason", ""), actor_username=actor.get("username", "user"), db_path=get_target_db()
        )
        return success_response(data=res, message=f"Invoice {res['invoice_number']} voided")
    except OrderValidationError as e:
        return error_response(str(e), status_code=e.status_code, errors=e.errors)
    except Exception as e:
        return error_response(f"Failed to void invoice: {str(e)}", status_code=500)
