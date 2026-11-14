import pytest
import tempfile
import os
from backend.app import create_app
from backend.config import Config
from backend.database.seed import seed_database

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

@pytest.fixture
def auth_headers(test_client):
    res = test_client.post("/api/auth/login", json={
        "identifier": "admin@stockflow.io",
        "password": "admin123"
    })
    token = res.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def user_headers(test_client):
    res = test_client.post("/api/auth/login", json={
        "identifier": "operator@stockflow.io",
        "password": "operator123"
    })
    token = res.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

def test_unauthenticated_product_reads_rejected(test_client):
    assert test_client.get("/api/products").status_code == 401
    assert test_client.get("/api/products/1").status_code == 401
    assert test_client.get("/api/products/export").status_code == 401

def test_get_products(test_client, auth_headers):
    res = test_client.get("/api/products", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert len(data["products"]) >= 12

def test_unauthenticated_product_mutations_rejected(test_client):
    # POST without auth -> 401
    res_post = test_client.post("/api/products", json={"sku": "SKU-UNAUTH", "name": "Unauth Prod"})
    assert res_post.status_code == 401

    # PUT without auth -> 401
    res_put = test_client.put("/api/products/1", json={"name": "Hacked Name"})
    assert res_put.status_code == 401

    # DELETE without auth -> 401
    res_del = test_client.delete("/api/products/1")
    assert res_del.status_code == 401

def test_rbac_user_cannot_delete_product(test_client, user_headers):
    # Operator with role 'user' cannot delete product -> 403
    res = test_client.delete("/api/products/1", headers=user_headers)
    assert res.status_code == 403
    assert "Insufficient permissions" in res.get_json()["error"]

def test_create_product(test_client, auth_headers):
    res = test_client.post("/api/products", headers=auth_headers, json={
        "sku": "SKU-TEST-99",
        "name": "Testing Sensor Module",
        "category": "Sensors",
        "unit_price": 19.99,
        "current_stock": 50,
        "min_stock": 10,
        "max_stock": 200
    })
    assert res.status_code == 201
    assert res.get_json()["data"]["sku"] == "SKU-TEST-99"

def test_update_product(test_client, auth_headers):
    res = test_client.put("/api/products/1", headers=auth_headers, json={
        "name": "Updated Microcontroller v2",
        "current_stock": 450
    })
    assert res.status_code == 200
    get_res = test_client.get("/api/products/1", headers=auth_headers)
    assert get_res.get_json()["data"]["product"]["name"] == "Updated Microcontroller v2"
    assert get_res.get_json()["data"]["product"]["current_stock"] == 450

def test_delete_product(test_client, auth_headers):
    res = test_client.delete("/api/products/2", headers=auth_headers)
    assert res.status_code == 200
    get_res = test_client.get("/api/products/2", headers=auth_headers)
    assert get_res.status_code == 404

def test_create_product_negative_values_rejected(test_client, auth_headers):
    res = test_client.post("/api/products", headers=auth_headers, json={
        "sku": "SKU-NEG-1",
        "name": "Negative Unit Price Item",
        "unit_price": -5.00
    })
    assert res.status_code == 400
    assert "Unit price cannot be negative" in res.get_json()["error"]

    res2 = test_client.post("/api/products", headers=auth_headers, json={
        "sku": "SKU-NEG-2",
        "name": "Negative Stock Item",
        "current_stock": -10
    })
    assert res2.status_code == 400
    assert "Current stock cannot be negative" in res2.get_json()["error"]

def test_create_product_validation_and_duplicate_sku(test_client, auth_headers):
    # max_stock < min_stock including max_stock = 0 must be rejected cleanly with 400
    res_bounds = test_client.post("/api/products", headers=auth_headers, json={
        "sku": "SKU-BOUNDS-1",
        "name": "Bounds Check Item",
        "category": "Staples",
        "unit_price": 0,
        "current_stock": 5,
        "min_stock": 10,
        "max_stock": 0,
    })
    assert res_bounds.status_code == 400
    bounds_data = res_bounds.get_json()
    assert bounds_data["errors"]["max_stock"]

    # Non-numeric input returns 400 JSON instead of 500
    res_nan = test_client.post("/api/products", headers=auth_headers, json={
        "sku": "SKU-NAN-1",
        "name": "NaN Price",
        "unit_price": "abc",
    })
    assert res_nan.status_code == 400
    assert res_nan.get_json()["errors"]["unit_price"]

    # Duplicate SKU returns 400 with field error
    res_dup = test_client.post("/api/products", headers=auth_headers, json={
        "sku": "sku-9021",
        "name": "Duplicate SKU Test",
        "unit_price": 10,
    })
    assert res_dup.status_code == 400
    dup_data = res_dup.get_json()
    assert "already exists" in dup_data["error"]
    assert "sku" in dup_data["errors"]

def test_update_product_validation_and_pagination(test_client, auth_headers):
    # Empty name rejected
    res_empty = test_client.put("/api/products/1", headers=auth_headers, json={"name": "   "})
    assert res_empty.status_code == 400
    assert res_empty.get_json()["errors"]["name"]

    # max_stock < min_stock rejected on update
    res_bounds = test_client.put("/api/products/1", headers=auth_headers, json={"min_stock": 50, "max_stock": 20})
    assert res_bounds.status_code == 400
    assert res_bounds.get_json()["errors"]["max_stock"]

    # Server pagination & filtering counts
    page1 = test_client.get("/api/products?limit=5&offset=0", headers=auth_headers).get_json()["data"]
    page2 = test_client.get("/api/products?limit=5&offset=5", headers=auth_headers).get_json()["data"]
    assert len(page1["products"]) == 5
    assert len(page2["products"]) == 5
    assert page1["products"][0]["id"] != page2["products"][0]["id"]
    assert page1["filtered_total"] == page1["total"]

    filtered = test_client.get("/api/products?search=basmati&limit=5&offset=0", headers=auth_headers).get_json()["data"]
    assert filtered["filtered_total"] == 1
    assert filtered["total"] >= 15

def test_export_products_csv(test_client, auth_headers):
    res = test_client.get("/api/products/export?search=basmati", headers=auth_headers)
    assert res.status_code == 200
    assert "text/csv" in res.content_type
    text = res.data.decode("utf-8")
    assert "sku,name,category,unit_price,currency" in text
    assert "SKU-9021" in text
    assert ",INR," in text
