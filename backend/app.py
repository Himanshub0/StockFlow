import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.config import Config
from backend.database.seed import seed_database
from backend.routes import (
    auth_bp,
    admin_bp,
    products_bp,
    inventory_bp,
    movements_bp,
    suppliers_bp,
    reports_bp,
    usage_bp,
    orders_bp
)

def create_app(config_class=Config):
    # Keep the legacy frontend when present; frontend1 is the active UI after
    # the original frontend directory was removed.
    frontend_dir = "../frontend" if os.path.isdir(os.path.join(os.path.dirname(__file__), "../frontend")) else "../frontend1"
    app = Flask(__name__, static_folder=frontend_dir, static_url_path="")
    app.config.from_object(config_class)

    raw_origins = app.config.get("CORS_ORIGINS", "*")
    if isinstance(raw_origins, str) and raw_origins.strip() != "*":
        cors_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    else:
        cors_origins = raw_origins
    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(movements_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(usage_bp)
    app.register_blueprint(orders_bp)

    # Auto-seed database if running on SQLite file
    try:
        seed_database(app.config.get("DATABASE_PATH"))
    except Exception as e:
        app.logger.warning(f"Database seed check: {e}")

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "service": "StockFlow Enterprise Backend API",
            "version": "2.5.0",
            "auth_supported": True,
            "admin_console": True
        })

    # Serve Landing Page as root
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    # Serve specific HTML pages (app.html, login.html, register.html) & assets
    @app.route("/<path:path>")
    def static_files(path):
        if path.startswith("api/"):
            return jsonify({"success": False, "error": "Endpoint not found", "status_code": 404}), 404
        target = os.path.join(app.static_folder, path)
        if os.path.exists(target) and not os.path.isdir(target):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found", "status_code": 404}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "error": "Internal server error", "status_code": 500}), 500

    return app

if __name__ == "__main__":
    application = create_app()
    port = int(os.environ.get("PORT", 5000))
    print(f"StockFlow API & Web Server running at http://localhost:{port}")
    application.run(host="0.0.0.0", port=port, debug=bool(application.config.get("DEBUG", False)))
