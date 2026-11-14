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
    res = test_client.post("/api/auth/login", json={"identifier": "admin@stockflow.io", "password": "admin123"})
    return {"Authorization": f"Bearer {res.get_json()['data']['token']}"}


def test_reports_summary_default_and_filtered(test_client, auth_headers):
    # Unauthenticated access rejected
    assert test_client.get("/api/reports/summary").status_code == 401

    res = test_client.get("/api/reports/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["currency"] == "INR"
    assert len(data["categories"]) >= 5
    assert len(data["movements"]) >= 3
    assert data["totals"]["total_products"] >= 15
    assert data["sales_summary"]["total_orders"] == 0
    assert data["purchase_summary"]["total_orders"] == 0

    # Category filter restricts categories and totals cleanly
    filtered = test_client.get("/api/reports/summary?category=Spices", headers=auth_headers).get_json()["data"]
    assert len(filtered["categories"]) == 1
    assert filtered["categories"][0]["category"] == "Spices"
    assert filtered["totals"]["total_products"] == 2

    # Invalid date range rejected with 400
    bad_dates = test_client.get("/api/reports/summary?start_date=2026-12-01&end_date=2026-01-01", headers=auth_headers)
    assert bad_dates.status_code == 400
    assert "Start date cannot be after end date" in bad_dates.get_json()["error"]
