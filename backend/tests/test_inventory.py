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

@pytest.fixture
def manager_headers(test_client):
    res = test_client.post("/api/auth/login", json={
        "identifier": "manager@stockflow.io",
        "password": "manager123"
    })
    token = res.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def shopkeeper_headers(test_client):
    res = test_client.post("/api/auth/login", json={
        "identifier": "shopkeeper@stockflow.io",
        "password": "shop123"
    })
    token = res.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

def test_unauthenticated_inventory_reads_rejected(test_client):
    assert test_client.get("/api/inventory/overview").status_code == 401
    assert test_client.get("/api/inventory/alerts").status_code == 401
    assert test_client.get("/api/inventory/settings").status_code == 401

def test_inventory_overview(test_client, auth_headers):
    res = test_client.get("/api/inventory/overview", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["total_items"] >= 12
    assert data["total_stock"] > 0
    assert data["currency"] == "USD"

def test_inventory_alerts(test_client, auth_headers):
    res = test_client.get("/api/inventory/alerts", headers=auth_headers)
    assert res.status_code == 200
    alerts = res.get_json()["data"]["alerts"]
    assert len(alerts) >= 2
    # Out-of-stock items must appear before low-stock items
    assert alerts[0]["current_stock"] == 0
    zero_seen_after_positive = False
    seen_positive = False
    for alert in alerts:
        if alert["current_stock"] > 0:
            seen_positive = True
        elif seen_positive and alert["current_stock"] == 0:
            zero_seen_after_positive = True
    assert zero_seen_after_positive is False
    assert alerts[0]["suggested_reorder"] >= 1

def test_inventory_settings_unauthenticated_rejected(test_client):
    put_res = test_client.put("/api/inventory/settings", json={"company_name": "Hacked Corp"})
    assert put_res.status_code == 401

def test_inventory_settings_rbac_user_forbidden(test_client, user_headers):
    put_res = test_client.put("/api/inventory/settings", headers=user_headers, json={"company_name": "Hacked Corp"})
    assert put_res.status_code == 403
    assert "Insufficient permissions" in put_res.get_json()["error"]

def test_inventory_settings_validation_and_role_boundary(test_client, auth_headers, manager_headers, shopkeeper_headers):
    # Invalid currency rejected
    bad_cur = test_client.put("/api/inventory/settings", headers=auth_headers, json={"currency": "XYZ"})
    assert bad_cur.status_code == 400
    assert bad_cur.get_json()["errors"]["currency"]

    # Invalid numeric bounds rejected
    bad_num = test_client.put("/api/inventory/settings", headers=auth_headers, json={"items_per_page": "2"})
    assert bad_num.status_code == 400
    assert bad_num.get_json()["errors"]["items_per_page"]

    # Non-admin manager/shopkeeper cannot update technical keys
    tech_res = test_client.put("/api/inventory/settings", headers=manager_headers, json={"cluster_region": "eu-west"})
    assert tech_res.status_code == 403
    tech_shop = test_client.put("/api/inventory/settings", headers=shopkeeper_headers, json={"backup_schedule": "hourly"})
    assert tech_shop.status_code == 403

    # Shopkeeper can update user-facing store settings
    shop_ok = test_client.put("/api/inventory/settings", headers=shopkeeper_headers, json={"company_name": "Corner Mart"})
    assert shop_ok.status_code == 200

    # Manager can update store settings cleanly without wiping technical keys
    ok_res = test_client.put("/api/inventory/settings", headers=manager_headers, json={
        "currency": "INR",
        "items_per_page": "25",
        "enable_realtime_alerts": "false",
    })
    assert ok_res.status_code == 200
    assert "cluster_region" not in ok_res.get_json()["data"]["settings"]
    overview = test_client.get("/api/inventory/overview", headers=manager_headers).get_json()["data"]
    assert overview["currency"] == "INR"

def test_non_admin_settings_hide_technical_keys(test_client, auth_headers, shopkeeper_headers):
    shop_get = test_client.get("/api/inventory/settings", headers=shopkeeper_headers).get_json()["data"]["settings"]
    assert "company_name" in shop_get
    assert "cluster_region" not in shop_get
    assert "backup_schedule" not in shop_get

    admin_get = test_client.get("/api/inventory/settings", headers=auth_headers).get_json()["data"]["settings"]
    assert "cluster_region" in admin_get
    assert "backup_schedule" in admin_get

def test_inventory_settings_get_and_put(test_client, auth_headers):
    res = test_client.get("/api/inventory/settings", headers=auth_headers)
    assert res.status_code == 200
    settings = res.get_json()["data"]["settings"]
    assert "company_name" in settings

    put_res = test_client.put("/api/inventory/settings", headers=auth_headers, json={"company_name": "Apollo Space Logistics"})
    assert put_res.status_code == 200

    verify_res = test_client.get("/api/inventory/settings", headers=auth_headers)
    assert verify_res.get_json()["data"]["settings"]["company_name"] == "Apollo Space Logistics"

def test_convert_catalog_currency(test_client, shopkeeper_headers, user_headers):
    # Regular operator forbidden
    denied = test_client.post("/api/inventory/convert-prices", headers=user_headers, json={"target_currency": "INR", "rate": 80})
    assert denied.status_code == 403

    # Invalid rate rejected
    bad_rate = test_client.post("/api/inventory/convert-prices", headers=shopkeeper_headers, json={"target_currency": "INR", "rate": -5})
    assert bad_rate.status_code == 400
    assert "rate" in bad_rate.get_json()["errors"]

    before_prod = test_client.get("/api/products/1", headers=shopkeeper_headers).get_json()["data"]["product"]
    res = test_client.post("/api/inventory/convert-prices", headers=shopkeeper_headers, json={"target_currency": "INR", "rate": 80})
    assert res.status_code == 200
    assert res.get_json()["data"]["currency"] == "INR"
    after_prod = test_client.get("/api/products/1", headers=shopkeeper_headers).get_json()["data"]["product"]
    assert after_prod["unit_price"] == round(before_prod["unit_price"] * 80, 2)
