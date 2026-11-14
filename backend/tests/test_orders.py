import os
import tempfile
import pytest
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

    seed_database(temp_db)
    app = create_app(CustomTestConfig)
    with app.test_client() as client:
        yield client

    if os.path.exists(temp_db):
        try:
            os.remove(temp_db)
        except Exception:
            pass


def _login(client, identifier, password):
    res = client.post("/api/auth/login", json={"identifier": identifier, "password": password})
    return {"Authorization": f"Bearer {res.get_json()['data']['token']}"}


@pytest.fixture
def shopkeeper_headers(test_client):
    return _login(test_client, "shopkeeper@stockflow.io", "shop123")


@pytest.fixture
def user_headers(test_client):
    return _login(test_client, "operator@stockflow.io", "operator123")


def test_orders_require_auth(test_client):
    assert test_client.get("/api/purchase-orders").status_code == 401
    assert test_client.post("/api/purchase-orders", json={}).status_code == 401
    assert test_client.get("/api/sales-orders").status_code == 401
    assert test_client.post("/api/sales-orders", json={}).status_code == 401


def test_purchase_order_lifecycle_updates_stock_and_movements(test_client, shopkeeper_headers):
    # Product 6 starts at 0 (out_of_stock)
    p_before = test_client.get("/api/products/6", headers=shopkeeper_headers).get_json()["data"]["product"]
    assert p_before["current_stock"] == 0

    create_res = test_client.post("/api/purchase-orders", headers=shopkeeper_headers, json={
        "supplier_id": 5,
        "status": "ordered",
        "notes": "Restock detergent",
        "items": [{"product_id": 6, "quantity": 40, "unit_cost": 5.50}],
    })
    assert create_res.status_code == 201
    po = create_res.get_json()["data"]["purchase_order"]
    assert po["total_cost"] == 220.0
    assert po["status"] == "ordered"

    # Stock not changed until received
    p_mid = test_client.get("/api/products/6", headers=shopkeeper_headers).get_json()["data"]["product"]
    assert p_mid["current_stock"] == 0

    # Receive PO adds stock and logs INBOUND movement
    recv_res = test_client.post(f"/api/purchase-orders/{po['id']}/receive", headers=shopkeeper_headers)
    assert recv_res.status_code == 200
    assert recv_res.get_json()["data"]["purchase_order"]["status"] == "received"

    p_after = test_client.get("/api/products/6", headers=shopkeeper_headers).get_json()["data"]["product"]
    assert p_after["current_stock"] == 40
    assert p_after["status"] == "in_stock"

    # Double receive rejected
    double_recv = test_client.post(f"/api/purchase-orders/{po['id']}/receive", headers=shopkeeper_headers)
    assert double_recv.status_code == 400


def test_sales_order_atomic_stock_discount_and_void_workflow(test_client, shopkeeper_headers, user_headers):
    # Product 1 starts at 420
    # 1. Duplicate lines exceeding available stock must fail atomically
    oversell = test_client.post("/api/sales-orders", headers=shopkeeper_headers, json={
        "customer_name": "Bulk Buyer",
        "items": [
            {"product_id": 1, "quantity": 300},
            {"product_id": 1, "quantity": 200},
        ],
    })
    assert oversell.status_code == 400
    assert "Insufficient stock" in oversell.get_json()["error"]

    # 2. Discount exceeding subtotal rejected
    bad_disc = test_client.post("/api/sales-orders", headers=shopkeeper_headers, json={
        "customer_name": "Walk-in",
        "discount": 500,
        "items": [{"product_id": 1, "quantity": 2, "unit_price": 14.50}],
    })
    assert bad_disc.status_code == 400
    assert "discount" in bad_disc.get_json()["errors"]

    # 3. Valid sale deducts stock, logs OUTBOUND movement, and updates reports
    ok_sale = test_client.post("/api/sales-orders", headers=shopkeeper_headers, json={
        "customer_name": "Priya Patel",
        "payment_method": "card",
        "discount": 4.0,
        "items": [{"product_id": 1, "quantity": 10, "unit_price": 15.0}],
    })
    assert ok_sale.status_code == 201
    so = ok_sale.get_json()["data"]["sales_order"]
    assert so["subtotal"] == 150.0
    assert so["total_amount"] == 146.0

    p_after = test_client.get("/api/products/1", headers=shopkeeper_headers).get_json()["data"]["product"]
    assert p_after["current_stock"] == 410

    rep = test_client.get("/api/reports/summary", headers=shopkeeper_headers).get_json()["data"]
    assert rep["sales_summary"]["total_orders"] == 1
    assert rep["sales_summary"]["net_revenue"] == 146.0
    assert rep["sales_summary"]["units_sold"] == 10

    # 4. Operator ('user') forbidden from voiding; shopkeeper restores stock cleanly
    denied_void = test_client.post(f"/api/sales-orders/{so['id']}/void", headers=user_headers, json={"reason": "Test"})
    assert denied_void.status_code == 403

    void_res = test_client.post(f"/api/sales-orders/{so['id']}/void", headers=shopkeeper_headers, json={"reason": "Customer returned items"})
    assert void_res.status_code == 200
    p_restored = test_client.get("/api/products/1", headers=shopkeeper_headers).get_json()["data"]["product"]
    assert p_restored["current_stock"] == 420
