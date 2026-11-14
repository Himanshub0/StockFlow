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

    seed_database(temp_db)
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
        "identifier": "operator@stockflow.io",
        "password": "operator123"
    })
    token = res.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

def test_unauthenticated_movement_reads_rejected(test_client):
    assert test_client.get("/api/movements").status_code == 401
    assert test_client.get("/api/movements/export").status_code == 401

def test_get_movements(test_client, auth_headers):
    res = test_client.get("/api/movements", headers=auth_headers)
    assert res.status_code == 200
    movements = res.get_json()["data"]["movements"]
    assert len(movements) >= 6

def test_unauthenticated_movement_rejected(test_client):
    res = test_client.post("/api/movements", json={
        "product_id": 1,
        "type": "INBOUND",
        "quantity": 10
    })
    assert res.status_code == 401

def test_record_inbound_movement(test_client, auth_headers):
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "type": "INBOUND",
        "quantity": 100,
        "reference_no": "PO-TEST-1",
        "performed_by": "tester"
    })
    assert res.status_code == 201
    data = res.get_json()["data"]
    assert data["new_stock"] == 520 # 420 + 100

def test_transfer_movement_with_target_product(test_client, auth_headers):
    # Product 1 has 420, Product 2 has 145
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "target_product_id": 2,
        "type": "TRANSFER",
        "quantity": 50,
        "reference_no": "TRF-TEST-1"
    })
    assert res.status_code == 201
    data = res.get_json()["data"]
    assert data["new_stock"] == 370 # 420 - 50

    # Verify destination product stock was credited
    p2_res = test_client.get("/api/products/2", headers=auth_headers)
    assert p2_res.get_json()["data"]["product"]["current_stock"] == 195 # 145 + 50

def test_transfer_missing_destination_rejected(test_client, auth_headers):
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "type": "TRANSFER",
        "quantity": 10,
        "reference_no": "TRF-NO-DEST"
    })
    assert res.status_code == 400
    assert "Destination product ID" in res.get_json()["error"]

    # Verify stock 1 was not modified
    p1 = test_client.get("/api/products/1", headers=auth_headers).get_json()["data"]["product"]
    assert p1["current_stock"] == 420

def test_transfer_nonexistent_destination_rejected(test_client, auth_headers):
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "target_product_id": 99999,
        "type": "TRANSFER",
        "quantity": 10
    })
    assert res.status_code == 404
    assert "Target product" in res.get_json()["error"]

    p1 = test_client.get("/api/products/1", headers=auth_headers).get_json()["data"]["product"]
    assert p1["current_stock"] == 420

def test_transfer_same_product_rejected(test_client, auth_headers):
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "target_product_id": 1,
        "type": "TRANSFER",
        "quantity": 10
    })
    assert res.status_code == 400
    assert "Cannot transfer to the same product" in res.get_json()["error"]

def test_transfer_insufficient_stock_fails(test_client, auth_headers):
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "target_product_id": 2,
        "type": "TRANSFER",
        "quantity": 99999,
        "reference_no": "TRF-OVER-1"
    })
    assert res.status_code == 400
    assert "Insufficient stock" in res.get_json()["error"]

    # Verify atomic rollback
    p1 = test_client.get("/api/products/1", headers=auth_headers).get_json()["data"]["product"]
    p2 = test_client.get("/api/products/2", headers=auth_headers).get_json()["data"]["product"]
    assert p1["current_stock"] == 420
    assert p2["current_stock"] == 145

def test_outbound_insufficient_stock_fails(test_client, auth_headers):
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "type": "OUTBOUND",
        "quantity": 99999,
        "reference_no": "OUT-OVER-1"
    })
    assert res.status_code == 400
    assert "Insufficient stock" in res.get_json()["error"]

def test_adjustment_negative_stock_rejected(test_client, auth_headers):
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "type": "ADJUSTMENT",
        "quantity": -99999
    })
    assert res.status_code == 400
    assert "Adjustment would result in negative stock" in res.get_json()["error"]

def test_adjustment_requires_notes_when_valid_stock(test_client, auth_headers):
    res = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "type": "ADJUSTMENT",
        "quantity": -5,
        "notes": "   "
    })
    assert res.status_code == 400
    payload = res.get_json()
    assert "notes" in payload["errors"]

    res_ok = test_client.post("/api/movements", headers=auth_headers, json={
        "product_id": 1,
        "type": "ADJUSTMENT",
        "quantity": -5,
        "notes": "Cycle count discrepancy"
    })
    assert res_ok.status_code == 201
    assert res_ok.get_json()["data"]["new_stock"] == 415

def test_movements_pagination_and_search(test_client, auth_headers):
    res = test_client.get("/api/movements?limit=3&offset=0", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert len(data["movements"]) == 3
    assert data["total"] >= 6
    assert data["filtered_total"] == data["total"]

    # Date filter validation and export CSV
    bad_dates = test_client.get("/api/movements?start_date=2026-12-01&end_date=2026-01-01", headers=auth_headers)
    assert bad_dates.status_code == 400

    export_res = test_client.get("/api/movements/export?type=INBOUND", headers=auth_headers)
    assert export_res.status_code == 200
    assert "text/csv" in export_res.content_type
    assert "sku,product_name,type,quantity" in export_res.data.decode("utf-8")
