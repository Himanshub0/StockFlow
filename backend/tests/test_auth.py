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

def test_login_success(test_client):
    res = test_client.post("/api/auth/login", json={
        "identifier": "admin@stockflow.io",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "token" in data["data"]
    assert data["data"]["user"]["role"] == "admin"

def test_login_invalid_password(test_client):
    res = test_client.post("/api/auth/login", json={
        "identifier": "admin@stockflow.io",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False

def test_register_new_user(test_client):
    res = test_client.post("/api/auth/register", json={
        "username": "sarahconnor",
        "email": "sarah@resistance.org",
        "password": "password123",
        "full_name": "Sarah Connor",
        "role": "shopkeeper"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["username"] == "sarahconnor"
    assert data["data"]["user"]["role"] == "shopkeeper"
    assert "token" in data["data"]

def test_register_privileged_roles_rejected(test_client):
    for role in ("admin", "manager"):
        res = test_client.post("/api/auth/register", json={
            "username": f"priv_{role}",
            "email": f"priv_{role}@evil.org",
            "password": "password123",
            "role": role
        })
        assert res.status_code == 403
        assert "cannot be self-registered" in res.get_json()["error"]

def test_register_duplicate_email(test_client):
    res = test_client.post("/api/auth/register", json={
        "username": "admin2",
        "email": "admin@stockflow.io",
        "password": "password123",
        "full_name": "Duplicate Admin"
    })
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert "already registered" in data["error"]

def test_register_and_login_store_roles(test_client):
    roles = ["shopkeeper", "wholesaler", "staff", "user"]
    for role in roles:
        username = f"user_{role}"
        email = f"{role}@teststore.com"
        pwd = "password123"
        # Register
        res_reg = test_client.post("/api/auth/register", json={
            "username": username,
            "email": email,
            "password": pwd,
            "full_name": f"Test {role.capitalize()}",
            "role": role
        })
        assert res_reg.status_code == 201
        data_reg = res_reg.get_json()
        assert data_reg["success"] is True
        assert data_reg["data"]["user"]["role"] == role
        assert "token" in data_reg["data"]

        # Login
        res_login = test_client.post("/api/auth/login", json={
            "identifier": email,
            "password": pwd
        })
        assert res_login.status_code == 200
        data_login = res_login.get_json()
        assert data_login["success"] is True
        assert data_login["data"]["user"]["role"] == role
        token = data_login["data"]["token"]

        # Verify /me
        res_me = test_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res_me.status_code == 200
        assert res_me.get_json()["data"]["user"]["role"] == role

def test_seeded_store_accounts_login(test_client):
    # Verify pre-seeded demo accounts work out of the box
    accounts = [
        ("shopkeeper@stockflow.io", "shop123", "shopkeeper"),
        ("wholesaler@stockflow.io", "wholesale123", "wholesaler"),
        ("manager@stockflow.io", "manager123", "manager"),
        ("staff@stockflow.io", "staff123", "staff"),
        ("admin@stockflow.io", "admin123", "admin"),
    ]
    for email, pwd, expected_role in accounts:
        res = test_client.post("/api/auth/login", json={"identifier": email, "password": pwd})
        assert res.status_code == 200
        user = res.get_json()["data"]["user"]
        assert user["role"] == expected_role

def test_register_invalid_role_rejected(test_client):
    res = test_client.post("/api/auth/register", json={
        "username": "hacker",
        "email": "hacker@evil.org",
        "password": "password123",
        "role": "supergod"
    })
    assert res.status_code == 400
    assert "Invalid role" in res.get_json()["error"]

def test_session_persistence_across_cache_clear(test_client):
    from backend.services.auth_service import _ACTIVE_SESSIONS
    # 1. Login
    login_res = test_client.post("/api/auth/login", json={
        "identifier": "admin@stockflow.io",
        "password": "admin123"
    })
    assert login_res.status_code == 200
    token = login_res.get_json()["data"]["token"]

    # 2. Simulate server restart by clearing in-memory cache
    _ACTIVE_SESSIONS.clear()

    # 3. Request /me using persistent SQLite session
    me_res = test_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.get_json()["data"]["user"]["username"] == "admin"

def test_session_expired_rejected(test_client):
    from datetime import datetime, timedelta
    from backend.services.auth_service import _ACTIVE_SESSIONS
    from backend.database.connection import get_db

    # Login
    login_res = test_client.post("/api/auth/login", json={
        "identifier": "admin@stockflow.io",
        "password": "admin123"
    })
    token = login_res.get_json()["data"]["token"]

    # Make token expired in both memory and db
    past = (datetime.now() - timedelta(days=2)).isoformat()
    if token in _ACTIVE_SESSIONS:
        _ACTIVE_SESSIONS[token]["expires_at"] = past

    conn = get_db(test_client.application.config["DATABASE_PATH"])
    conn.execute("UPDATE user_sessions SET expires_at = ? WHERE token = ?", (past, token))
    conn.commit()
    conn.close()

    # Verify expired token is rejected
    me_res = test_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 401

def test_logout_invalidates_session(test_client):
    login_res = test_client.post("/api/auth/login", json={
        "identifier": "admin@stockflow.io",
        "password": "admin123"
    })
    token = login_res.get_json()["data"]["token"]

    # Verify active
    me_res = test_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200

    # Logout
    logout_res = test_client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200

    # Verify now rejected
    me_res2 = test_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res2.status_code == 401

def test_profile_and_password_change(test_client):
    reg_res = test_client.post("/api/auth/register", json={
        "username": "selfservice",
        "email": "self@store.io",
        "password": "oldpassword123",
        "full_name": "Initial Name",
    })
    assert reg_res.status_code == 201
    token = reg_res.get_json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile name
    prof_res = test_client.patch("/api/auth/profile", headers=headers, json={"full_name": "Updated Storekeeper"})
    assert prof_res.status_code == 200
    assert prof_res.get_json()["data"]["user"]["full_name"] == "Updated Storekeeper"

    # Wrong current password rejected
    bad_pw = test_client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "wrong",
        "new_password": "newpassword123",
    })
    assert bad_pw.status_code == 403

    # Valid password change succeeds and login with new password works
    ok_pw = test_client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "oldpassword123",
        "new_password": "newpassword123",
    })
    assert ok_pw.status_code == 200
    login_new = test_client.post("/api/auth/login", json={"identifier": "self@store.io", "password": "newpassword123"})
    assert login_new.status_code == 200
