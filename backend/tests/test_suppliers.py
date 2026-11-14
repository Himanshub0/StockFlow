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

def test_unauthenticated_supplier_reads_rejected(test_client):
    assert test_client.get("/api/suppliers").status_code == 401
    assert test_client.get("/api/suppliers/1").status_code == 401

def test_get_suppliers(test_client, auth_headers):
    res = test_client.get("/api/suppliers", headers=auth_headers)
    assert res.status_code == 200
    suppliers = res.get_json()["data"]["suppliers"]
    assert len(suppliers) >= 5

def test_unauthenticated_supplier_mutations_rejected(test_client):
    res_post = test_client.post("/api/suppliers", json={"name": "No Auth", "code": "SUP-NOAUTH"})
    assert res_post.status_code == 401

    res_put = test_client.put("/api/suppliers/1", json={"name": "No Auth"})
    assert res_put.status_code == 401

    res_del = test_client.delete("/api/suppliers/1")
    assert res_del.status_code == 401

def test_rbac_user_cannot_delete_supplier(test_client, user_headers):
    res = test_client.delete("/api/suppliers/1", headers=user_headers)
    assert res.status_code == 403
    assert "Insufficient permissions" in res.get_json()["error"]

def test_create_supplier(test_client, auth_headers):
    res = test_client.post("/api/suppliers", headers=auth_headers, json={
        "code": "SUP-TEST-9",
        "name": "Test Components Corp",
        "tier": "Tier A",
        "contact_name": "Test Tester",
        "email": "test@components.com"
    })
    assert res.status_code == 201
    assert res.get_json()["data"]["code"] == "SUP-TEST-9"

def test_update_supplier_success_and_preservation(test_client, auth_headers):
    # Fetch existing supplier 1
    orig = test_client.get("/api/suppliers/1", headers=auth_headers).get_json()["data"]["supplier"]

    # Partial update: update name only, omit contact_name, email, lead_time
    res = test_client.put("/api/suppliers/1", headers=auth_headers, json={
        "name": "Apex Semiconductor International"
    })
    assert res.status_code == 200
    updated = res.get_json()["data"]["supplier"]
    assert updated["name"] == "Apex Semiconductor International"
    # Preserved fields
    assert updated["code"] == orig["code"]
    assert updated["contact_name"] == orig["contact_name"]
    assert updated["email"] == orig["email"]
    assert updated["lead_time_days"] == orig["lead_time_days"]

def test_update_supplier_not_found(test_client, auth_headers):
    res = test_client.put("/api/suppliers/99999", headers=auth_headers, json={
        "name": "Ghost Supplier"
    })
    assert res.status_code == 404
    assert "Supplier not found" in res.get_json()["error"]

def test_update_supplier_invalid_input(test_client, auth_headers):
    # Invalid tier
    res1 = test_client.put("/api/suppliers/1", headers=auth_headers, json={"tier": "Tier Z"})
    assert res1.status_code == 400

    # Invalid email
    res2 = test_client.put("/api/suppliers/1", headers=auth_headers, json={"email": "not-an-email"})
    assert res2.status_code == 400

    # Negative lead time
    res3 = test_client.put("/api/suppliers/1", headers=auth_headers, json={"lead_time_days": -5})
    assert res3.status_code == 400

def test_delete_supplier(test_client, auth_headers):
    res = test_client.delete("/api/suppliers/2", headers=auth_headers)
    assert res.status_code == 200
    get_res = test_client.get("/api/suppliers/2", headers=auth_headers)
    assert get_res.status_code == 404

def test_supplier_structured_errors(test_client, auth_headers):
    bad = test_client.post("/api/suppliers", headers=auth_headers, json={
        "name": "Duplicate Supplier",
        "code": "SUP-101",
        "email": "bad-email",
        "rating": 8.0,
    })
    assert bad.status_code == 400
    assert "email" in bad.get_json()["errors"]
    assert "rating" in bad.get_json()["errors"]

    dup = test_client.post("/api/suppliers", headers=auth_headers, json={
        "name": "Duplicate Supplier",
        "code": "SUP-101",
    })
    assert dup.status_code == 400
    assert "code" in dup.get_json()["errors"]
