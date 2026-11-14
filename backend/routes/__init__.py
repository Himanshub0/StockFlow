from backend.routes.auth import auth_bp
from backend.routes.admin import admin_bp
from backend.routes.products import products_bp
from backend.routes.inventory import inventory_bp
from backend.routes.movements import movements_bp
from backend.routes.suppliers import suppliers_bp
from backend.routes.reports import reports_bp
from backend.routes.usage import usage_bp
from backend.routes.orders import orders_bp

__all__ = [
    "auth_bp",
    "admin_bp",
    "products_bp",
    "inventory_bp",
    "movements_bp",
    "suppliers_bp",
    "reports_bp",
    "usage_bp",
    "orders_bp"
]
