# StockFlow — Project Overview

StockFlow is an inventory and warehouse management system combining a Flask/SQLite backend with a modern web interface.

## Architecture

- **Backend:** Flask 3.x REST API with Blueprint routing (`backend/routes`), service layer (`backend/services`), and SQLite database with foreign keys and WAL mode.
- **Authentication:** Token-based sessions with SQLite persistence in `user_sessions` and constant-time PBKDF2 password hashing.
- **Frontend:** Responsive client dashboard with dark/light themes, real-time KPI metrics, SKU catalog, supplier management, and audit logs.
- **Database:** SQLite (`instance/stockflow.db`) with automatic schema initialization and data seeding.

## Running the Application

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python -m backend.app
```
Access the application at `http://localhost:5000`.

### 3. Run Test Suite
```bash
python -m pytest
```
