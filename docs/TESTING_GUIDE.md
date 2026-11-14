# StockFlow Testing Guide

StockFlow test suites use `pytest` and execute against isolated temporary SQLite databases per test run.

## Running Tests

### Execute Entire Test Suite
```bash
python -m pytest
```

### Run Specific Modules
```bash
# Authentication & Session Persistence
python -m pytest backend/tests/test_auth.py

# Administration & RBAC Authorization
python -m pytest backend/tests/test_admin.py

# Inventory Movements & Transfers
python -m pytest backend/tests/test_movements.py

# Products CRUD & Validation
python -m pytest backend/tests/test_products.py

# Suppliers
python -m pytest backend/tests/test_suppliers.py
```

## Test Structure & Conventions

- Every test suite configures a dedicated temporary SQLite instance via the `test_client` fixture.
- Database seeds are executed prior to testing.
- Temporary database files are unlinked in teardown.
- RBAC and security tests verify both positive authorization flows and negative access attempts (401 Unauthorized and 403 Forbidden).
