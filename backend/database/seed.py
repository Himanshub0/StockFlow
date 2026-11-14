from backend.database.connection import get_db, init_db
from backend.utils.validators import hash_password

def seed_database(db_path=None, with_demo_data=False):
    """Initializes the schema; sample records are available only to test fixtures."""
    init_db(db_path)
    conn = get_db(db_path)
    try:
        if not with_demo_data:
            conn.executemany(
                """INSERT INTO system_settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO NOTHING""",
                [
                    ("company_name", "StockFlow Store"),
                    ("currency", "INR"),
                    ("default_low_stock_threshold", "15"),
                    ("enable_realtime_alerts", "true"),
                    ("items_per_page", "15"),
                    ("cluster_region", "local-store"),
                    ("backup_schedule", "daily_2200_close"),
                ],
            )
            conn.commit()
            return
        # 1. Seed Users (All 5 Roles: shopkeeper, wholesaler, manager, staff, admin + backward compat)
        user_count = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        if user_count == 0:
            users_to_seed = [
                ("admin", "admin@stockflow.io", hash_password("admin123"), "System Administrator", "admin", "active"),
                ("manager", "manager@stockflow.io", hash_password("manager123"), "Priya Sharma (Store Manager)", "manager", "active"),
                ("shopkeeper", "shopkeeper@stockflow.io", hash_password("shop123"), "Rajesh Kumar (Retail Shopkeeper)", "shopkeeper", "active"),
                ("wholesaler", "wholesaler@stockflow.io", hash_password("wholesale123"), "Amit Patel (Bulk Wholesaler)", "wholesaler", "active"),
                ("staff", "staff@stockflow.io", hash_password("staff123"), "Rohan Verma (Store Assistant)", "staff", "active"),
                ("operator", "operator@stockflow.io", hash_password("operator123"), "Marcus Chen (Inventory Specialist)", "user", "active"),
                ("auditor", "auditor@stockflow.io", hash_password("auditor123"), "Sophia Althaus (Compliance Officer)", "user", "active"),
            ]
            conn.executemany(
                """
                INSERT INTO users (username, email, password_hash, full_name, role, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                users_to_seed
            )

        # 2. Seed Suppliers (Preserves SUP-101 code for test_suppliers.py)
        supplier_count = conn.execute("SELECT COUNT(*) AS count FROM suppliers").fetchone()["count"]
        if supplier_count == 0:
            suppliers_to_seed = [
                ("SUP-101", "Apex Agro Supplies Ltd", "Tier A", "Dr. Alan Grant", "alan@apexsemi.com", "+1 415-555-0199", 5, 4.9, "active"),
                ("SUP-102", "National Grain & Oil Mills", "Tier A", "Suresh Nair", "orders@nationalgrain.com", "+91 22 5550 1420", 3, 4.8, "active"),
                ("SUP-103", "Sunrise Spices & Condiments", "Tier B", "Anil Deshmukh", "sales@sunrisespices.com", "+91 80 5550 1234", 4, 4.5, "active"),
                ("SUP-104", "Metro FMCG & Packaged Foods", "Tier A", "Deepak Gupta", "support@metrofmcg.com", "+91 11 5550 0188", 2, 4.9, "active"),
                ("SUP-105", "Prime Clean & Hygiene Care", "Tier B", "Kavita Rao", "orders@primeclean.com", "+91 40 5550 1765", 6, 4.2, "active"),
                ("SUP-106", "Heritage Tea & Coffee Estate", "Tier A", "Reiko Tanaka", "support@heritagetea.com", "+91 33 5550 0912", 4, 4.95, "active")
            ]
            conn.executemany(
                """
                INSERT INTO suppliers (code, name, tier, contact_name, email, phone, lead_time_days, rating, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                suppliers_to_seed
            )

        # 3. Seed Products (General Store FMCG & Retail - At least 15 items to fulfill test suite)
        product_count = conn.execute("SELECT COUNT(*) AS count FROM products").fetchone()["count"]
        if product_count == 0:
            products_to_seed = [
                ("SKU-9021", "Royal Basmati Rice (5kg Premium Bag)", "Grains & Rice", 14.50, 420, 50, 800, 1, "in_stock"),
                ("SKU-9022", "Refined Sunflower Cooking Oil (1L Bottle)", "Edible Oils", 4.75, 145, 30, 400, 2, "in_stock"),
                ("SKU-9023", "Organic Yellow Toor Dal (1kg Pack)", "Pulses & Lentils", 3.40, 18, 25, 300, 1, "low_stock"),
                ("SKU-9024", "Whole Wheat Atta Flour (10kg Bag)", "Flour & Grains", 9.80, 850, 100, 2000, 2, "in_stock"),
                ("SKU-9025", "Refined Pure Cane Sugar (1kg)", "Staples", 2.20, 85, 20, 250, 1, "in_stock"),
                ("SKU-9026", "Active Enzyme Detergent Powder (2kg)", "Home Care", 6.80, 0, 15, 100, 5, "out_of_stock"),
                ("SKU-9027", "Packaged Iodized Table Salt (1kg)", "Staples", 0.45, 12000, 1000, 30000, 1, "in_stock"),
                ("SKU-9028", "Sun-Dried Red Chilli Powder (200g)", "Spices", 2.10, 230, 50, 600, 3, "in_stock"),
                ("SKU-9029", "Organic Ground Turmeric Powder (200g)", "Spices", 1.85, 620, 100, 1500, 3, "in_stock"),
                ("SKU-9030", "Pure Traditional Desi Ghee (500ml)", "Dairy", 8.90, 74, 25, 200, 2, "in_stock"),
                ("SKU-9031", "Premium CTC Assam Tea Leaves (500g)", "Beverages", 5.50, 12, 30, 350, 6, "low_stock"),
                ("SKU-9032", "Roasted Classic Filter Coffee (200g)", "Beverages", 6.20, 65, 15, 180, 6, "in_stock"),
                ("SKU-9033", "Antibacterial Bath Soap Bar (Pack of 4)", "Personal Care", 3.25, 180, 25, 500, 5, "in_stock"),
                ("SKU-9034", "Crispy Wheat Crunch Biscuits (300g)", "Snacks", 1.50, 95, 20, 300, 4, "in_stock"),
                ("SKU-9035", "Instant Masala Noodles (Pack of 6)", "Snacks", 2.40, 60, 20, 250, 4, "in_stock")
            ]
            conn.executemany(
                """
                INSERT INTO products (sku, name, category, unit_price, current_stock, min_stock, max_stock, supplier_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                products_to_seed
            )

        # 4. Seed Movements (Store Operations: Inbound wholesale batches, outbound retail customer sales)
        movement_count = conn.execute("SELECT COUNT(*) AS count FROM movements").fetchone()["count"]
        if movement_count == 0:
            movements_to_seed = [
                (1, "INBOUND", 500, "PO-2026-081", "wholesaler", "Bulk pallet arrival of Basmati Rice from Apex Agro"),
                (1, "OUTBOUND", 80, "SO-2026-114", "shopkeeper", "Counter sales batch to retail walk-in customers"),
                (2, "INBOUND", 150, "PO-2026-082", "wholesaler", "Weekly cooking oil replenishment from National Grain"),
                (3, "OUTBOUND", 50, "SO-2026-120", "shopkeeper", "Dispatched to local restaurant order"),
                (4, "INBOUND", 1000, "PO-2026-085", "wholesaler", "Bulk shipment of Whole Wheat Atta bags"),
                (6, "ADJUSTMENT", -15, "ADJ-2026-004", "manager", "Damaged detergent packaging write-off"),
                (7, "INBOUND", 5000, "PO-2026-092", "wholesaler", "Scheduled table salt restock"),
                (8, "OUTBOUND", 120, "SO-2026-133", "shopkeeper", "Retail festival grocery combo pack dispatches")
            ]
            conn.executemany(
                """
                INSERT INTO movements (product_id, type, quantity, reference_no, performed_by, notes)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                movements_to_seed
            )

        # 5. Seed Audit Logs
        audit_count = conn.execute("SELECT COUNT(*) AS count FROM audit_logs").fetchone()["count"]
        if audit_count == 0:
            logs_to_seed = [
                (1, "admin", "SYSTEM_BOOT", "StockFlow Store Management SQLite WAL database initialized", "127.0.0.1", "success"),
                (1, "admin", "USER_SEEDED", "Store roles created: shopkeeper, wholesaler, manager, staff, admin", "127.0.0.1", "success"),
                (2, "manager", "STOCK_INSPECT", "Quarterly shelf cycle count completed for Main Store Aisle", "192.168.1.42", "success"),
                (3, "shopkeeper", "SALE_COMPLETED", "Counter receipt batch processed for retail customers", "192.168.1.88", "success")
            ]
            conn.executemany(
                """
                INSERT INTO audit_logs (user_id, username, action, details, ip_address, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                logs_to_seed
            )

        # 6. Seed System Settings
        settings_count = conn.execute("SELECT COUNT(*) AS count FROM system_settings").fetchone()["count"]
        if settings_count == 0:
            settings_to_seed = [
                ("company_name", "StockFlow General Store"),
                ("currency", "INR"),
                ("default_low_stock_threshold", "15"),
                ("enable_realtime_alerts", "true"),
                ("items_per_page", "15"),
                ("cluster_region", "local-store"),
                ("backup_schedule", "daily_2200_close")
            ]
            conn.executemany(
                "INSERT INTO system_settings (key, value) VALUES (?, ?)",
                settings_to_seed
            )

        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database(with_demo_data=True)
    print("Database seeded with sample store data.")
