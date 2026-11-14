import io
import os
import tempfile
from pathlib import Path
import pytest
from backend.app import create_app
from backend.config import Config
from backend.database.seed import seed_database

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


@pytest.fixture
def test_client():
    fd, temp_db = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    class CustomTestConfig(Config):
        TESTING = True
        DATABASE_PATH = temp_db

    seed_database(temp_db, with_demo_data=True)
    app = create_app(CustomTestConfig)
    with app.test_client() as client:
        yield client

    if os.path.exists(temp_db):
        try:
            os.remove(temp_db)
        except Exception:
            pass


def _login(test_client, identifier, password):
    res = test_client.post("/api/auth/login", json={"identifier": identifier, "password": password})
    token = res.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(test_client):
    return _login(test_client, "admin@stockflow.io", "admin123")


@pytest.fixture
def shopkeeper_headers(test_client):
    return _login(test_client, "shopkeeper@stockflow.io", "shop123")


@pytest.fixture
def user_headers(test_client):
    return _login(test_client, "operator@stockflow.io", "operator123")


def test_unauthenticated_csv_import_rejected(test_client):
    for endpoint in ("/api/suppliers/import", "/api/products/import", "/api/movements/import"):
        res = test_client.post(endpoint, json={"csv_text": "a,b\n1,2"})
        assert res.status_code == 401


def test_replace_mode_rbac_blocks_operator_allows_shopkeeper(test_client, user_headers, shopkeeper_headers):
    csv_text = "sku,name,category,unit_price,current_stock,min_stock,max_stock\nAPL-TEST-1,Apple Test Item,iPhone,79900,10,5,50\n"
    res_denied = test_client.post(
        "/api/products/import",
        headers=user_headers,
        json={"csv_text": csv_text, "mode": "replace"},
    )
    assert res_denied.status_code == 403

    res_allowed = test_client.post(
        "/api/products/import",
        headers=shopkeeper_headers,
        json={"csv_text": csv_text, "mode": "replace"},
    )
    assert res_allowed.status_code == 201
    assert res_allowed.get_json()["data"]["inserted"] == 1


def test_missing_headers_and_empty_csv_rejected(test_client, admin_headers):
    res_missing = test_client.post(
        "/api/products/import",
        headers=admin_headers,
        json={"csv_text": "name,category\nWidget,Mac"},
    )
    assert res_missing.status_code == 400
    assert "required column" in res_missing.get_json()["error"].lower()

    res_empty = test_client.post(
        "/api/products/import",
        headers=admin_headers,
        data={"file": (io.BytesIO(b""), "empty.csv")},
        content_type="multipart/form-data",
    )
    assert res_empty.status_code == 400


def test_products_csv_auto_creates_suppliers_when_imported_standalone(test_client, admin_headers):
    with open(DATA_DIR / "products.csv", "rb") as f:
        res = test_client.post(
            "/api/products/import",
            headers=admin_headers,
            data={"file": (f, "products.csv"), "mode": "replace"},
            content_type="multipart/form-data",
        )
    assert res.status_code == 201
    data = res.get_json()["data"]
    assert data["inserted"] == 79
    assert data["error_count"] == 0
    assert data["suppliers_created"] >= 10

    prods_res = test_client.get("/api/products?limit=2000", headers=admin_headers)
    assert prods_res.status_code == 200
    prods_data = prods_res.get_json()["data"]
    assert prods_data["total"] == 79
    assert len(prods_data["products"]) == 79
    assert len(prods_data["categories"]) == 5
    # Verify supplier got linked
    assert all(p["supplier_name"] for p in prods_data["products"])


def test_full_apple_store_dataset_import_and_analytics(test_client, admin_headers):
    # 1. Replace suppliers with tech store suppliers
    with open(DATA_DIR / "suppliers.csv", "rb") as f:
        s_res = test_client.post(
            "/api/suppliers/import",
            headers=admin_headers,
            data={"file": (f, "suppliers.csv"), "mode": "replace"},
            content_type="multipart/form-data",
        )
    assert s_res.status_code == 201
    assert s_res.get_json()["data"]["inserted"] == 12
    assert s_res.get_json()["data"]["error_count"] == 0

    # 2. Replace products with tech store catalog (79 SKUs)
    with open(DATA_DIR / "products.csv", "rb") as f:
        p_res = test_client.post(
            "/api/products/import",
            headers=admin_headers,
            data={"file": (f, "products.csv"), "mode": "replace"},
            content_type="multipart/form-data",
        )
    assert p_res.status_code == 201
    p_data = p_res.get_json()["data"]
    assert p_data["inserted"] == 79
    assert p_data["suppliers_created"] == 0
    assert p_data["error_count"] == 0

    # 3. Import movements in apply_stock=true mode -> all 104 rows succeed
    with open(DATA_DIR / "movements.csv", "rb") as f:
        m_res = test_client.post(
            "/api/movements/import",
            headers=admin_headers,
            data={"file": (f, "movements.csv"), "mode": "replace", "apply_stock": "true"},
            content_type="multipart/form-data",
        )
    assert m_res.status_code == 201
    m_data = m_res.get_json()["data"]
    assert m_data["inserted"] == 104
    assert m_data["error_count"] == 0

    # 4. Verify overview, alerts, movements, and reports
    overview = test_client.get("/api/inventory/overview", headers=admin_headers).get_json()["data"]
    assert overview["total_items"] == 79
    assert overview["total_stock"] > 1000
    assert overview["low_stock_count"] > 0
    assert overview["out_of_stock_count"] > 0

    alerts = test_client.get("/api/inventory/alerts", headers=admin_headers).get_json()["data"]["alerts"]
    assert len(alerts) == overview["low_stock_count"] + overview["out_of_stock_count"]

    movements = test_client.get("/api/movements?limit=1000", headers=admin_headers).get_json()["data"]["movements"]
    assert len(movements) >= 104

    reports = test_client.get("/api/reports/summary", headers=admin_headers).get_json()["data"]
    assert len(reports["categories"]) == 5
    assert len(reports["movements"]) == 4


def test_movements_historical_mode_preserves_stock(test_client, admin_headers):
    with open(DATA_DIR / "suppliers.csv", "rb") as f:
        test_client.post(
            "/api/suppliers/import",
            headers=admin_headers,
            data={"file": (f, "suppliers.csv"), "mode": "replace"},
            content_type="multipart/form-data",
        )
    with open(DATA_DIR / "products.csv", "rb") as f:
        test_client.post(
            "/api/products/import",
            headers=admin_headers,
            data={"file": (f, "products.csv"), "mode": "replace"},
            content_type="multipart/form-data",
        )
    before = test_client.get("/api/inventory/overview", headers=admin_headers).get_json()["data"]

    with open(DATA_DIR / "movements.csv", "rb") as f:
        m_res = test_client.post(
            "/api/movements/import",
            headers=admin_headers,
            data={"file": (f, "movements.csv"), "mode": "replace", "apply_stock": "false"},
            content_type="multipart/form-data",
        )
    assert m_res.status_code == 201
    assert m_res.get_json()["data"]["inserted"] == 104

    after = test_client.get("/api/inventory/overview", headers=admin_headers).get_json()["data"]
    assert after == before


def test_upsert_skip_and_partial_errors(test_client, admin_headers):
    # Insert initial supplier + product
    s_csv = "code,name,tier\nSUP-UPSERT,First Name,Tier A\n"
    res = test_client.post("/api/suppliers/import", headers=admin_headers, json={"csv_text": s_csv, "mode": "upsert"})
    assert res.status_code == 201
    assert res.get_json()["data"]["inserted"] == 1

    # Skip mode ignores duplicate code
    s_csv2 = "code,name,tier\nSUP-UPSERT,Changed Name,Tier B\nSUP-NEW,Brand New,Tier A\n"
    res_skip = test_client.post("/api/suppliers/import", headers=admin_headers, json={"csv_text": s_csv2, "mode": "skip"})
    assert res_skip.status_code == 201
    d_skip = res_skip.get_json()["data"]
    assert d_skip["skipped"] == 1
    assert d_skip["inserted"] == 1

    # Upsert updates existing code
    res_up = test_client.post("/api/suppliers/import", headers=admin_headers, json={"csv_text": s_csv2, "mode": "upsert"})
    assert res_up.status_code == 201
    assert res_up.get_json()["data"]["updated"] == 2

    # Partial row errors in products CSV (2 valid, 1 negative price)
    p_csv = (
        "sku,name,category,unit_price,current_stock,min_stock,max_stock\n"
        "APL-PART-1,Valid Product 1,iPhone,79900,10,5,50\n"
        "APL-BAD-1,Bad Negative Price,iPhone,-100,10,5,50\n"
        "APL-PART-2,Valid Product 2,Mac,99900,5,2,20\n"
    )
    res_part = test_client.post("/api/products/import", headers=admin_headers, json={"csv_text": p_csv, "mode": "upsert"})
    assert res_part.status_code == 201
    d_part = res_part.get_json()["data"]
    assert d_part["inserted"] == 2
    assert d_part["error_count"] == 1
    assert d_part["errors"][0]["row"] == 3

    # All-invalid CSV rolls back with 400
    bad_csv = "sku,name,unit_price\nAPL-ONLY-BAD,Broken Item,-50\n"
    res_all_bad = test_client.post("/api/products/import", headers=admin_headers, json={"csv_text": bad_csv, "mode": "upsert"})
    assert res_all_bad.status_code == 400
