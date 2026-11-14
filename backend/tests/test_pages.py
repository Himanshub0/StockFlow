import pytest
import tempfile
import os
from backend.app import create_app
from backend.config import Config

@pytest.fixture
def client():
    fd, temp_db = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    class CustomTestConfig(Config):
        TESTING = True
        DATABASE_PATH = temp_db

    app = create_app(CustomTestConfig)
    with app.test_client() as c:
        yield c

    if os.path.exists(temp_db):
        try:
            os.remove(temp_db)
        except Exception:
            pass

def test_landing_page_is_main_html(client):
    res = client.get("/")
    assert res.status_code == 200
    assert b"StockFlow" in res.data
    assert b"Your store." in res.data
    assert b"Under control." in res.data
    assert b"Inventory management" in res.data

def test_app_page_served(client):
    res = client.get("/app.html")
    assert res.status_code == 200
    assert b"app-sidebar" in res.data

def test_login_page_served(client):
    res = client.get("/login.html")
    assert res.status_code == 200
    assert b"login-form" in res.data
    assert b"Log in to StockFlow" in res.data

def test_register_page_served(client):
    res = client.get("/register.html")
    assert res.status_code == 200
    assert b"register-form" in res.data
    assert b"Create your account" in res.data

def test_unknown_api_returns_json_404(client):
    res = client.get("/api/nonexistent_endpoint")
    assert res.status_code == 404
    json_data = res.get_json()
    assert json_data["success"] is False
