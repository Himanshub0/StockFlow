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
def admin_headers(test_client):
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

def test_unauthenticated_admin_access_rejected(test_client):
    res = test_client.get("/api/admin/metrics")
    assert res.status_code == 401
    assert res.get_json()["success"] is False

    res_users = test_client.get("/api/admin/users")
    assert res_users.status_code == 401

    res_patch = test_client.patch("/api/admin/users/2/role", json={"role": "admin"})
    assert res_patch.status_code == 401

def test_non_admin_forbidden(test_client, user_headers):
    res = test_client.get("/api/admin/metrics", headers=user_headers)
    assert res.status_code == 403
    assert res.get_json()["success"] is False

    res_users = test_client.get("/api/admin/users", headers=user_headers)
    assert res_users.status_code == 403

def test_admin_metrics(test_client, admin_headers):
    res = test_client.get("/api/admin/metrics", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["users"]["total"] >= 4
    assert data["data"]["inventory"]["total_products"] >= 8

def test_admin_users_list(test_client, admin_headers):
    res = test_client.get("/api/admin/users", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    users = data["data"]["users"]
    assert len(users) >= 4
    admin_user = next((u for u in users if u["username"] == "admin"), None)
    assert admin_user is not None
    assert admin_user["role"] == "admin"

def test_admin_update_user_role(test_client, admin_headers):
    res = test_client.patch("/api/admin/users/3/role", json={"role": "manager"}, headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["data"]["role"] == "manager"

def test_admin_prevent_demoting_last_admin(test_client, admin_headers):
    # Try demoting user 1 (the only admin)
    res = test_client.patch("/api/admin/users/1/role", json={"role": "user"}, headers=admin_headers)
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert "last remaining active Administrator" in data["error"]

def test_admin_audit_logs(test_client, admin_headers):
    res = test_client.get("/api/admin/audit-logs", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]["logs"]) > 0

def test_admin_can_create_privileged_users(test_client, admin_headers):
    res = test_client.post("/api/admin/users", headers=admin_headers, json={
        "username": "ops_mgr",
        "email": "opsmgr@stockflow.io",
        "password": "password123",
        "full_name": "Ops Manager",
        "role": "manager",
    })
    assert res.status_code == 201
    assert res.get_json()["data"]["user"]["role"] == "manager"
