# StockFlow API Documentation

All API responses follow the standard JSON envelope:
```json
{
  "success": true,
  "data": {},
  "message": "Operation description",
  "status_code": 200
}
```

## Authentication (`/api/auth`)

- `POST /api/auth/register` — Create a new user account.
- `POST /api/auth/login` — Authenticate with email/username and password. Returns Bearer token.
- `GET /api/auth/me` — Retrieve active profile (requires `Authorization: Bearer <token>`).
- `POST /api/auth/logout` — Revoke active token.

## Administration (`/api/admin`)
*(Requires Administrator clearance)*

- `GET /api/admin/metrics` — Telemetry on users, inventory, and system health.
- `GET /api/admin/users` — Directory of registered users.
- `POST /api/admin/users` — Provision a user account.
- `PATCH /api/admin/users/<id>/role` — Modify user role (`admin`, `manager`, `user`, `staff`).
- `PATCH /api/admin/users/<id>/status` — Suspend or activate user.
- `DELETE /api/admin/users/<id>` — Remove user.
- `GET /api/admin/audit-logs` — Paginated security audit trail.

## Products (`/api/products`)

- `GET /api/products` — List products with optional `category`, `status`, `search`, `limit`, `offset`.
- `GET /api/products/<id>` — Single product detail.
- `POST /api/products` — Create product (`sku`, `name`, `category`, `unit_price`, `current_stock`, etc.).
- `POST /api/products/import` — Bulk import products from CSV (`file` multipart or `csv_text` JSON; `mode`: `upsert`, `skip`, or `replace`). Auto-links or creates suppliers by `supplier_code`/`supplier_name`.
- `PUT /api/products/<id>` — Update product attributes.
- `DELETE /api/products/<id>` — Delete product.

## Stock Movements (`/api/movements`)

- `GET /api/movements` — Fetch chronological stock ledger (supports `type`, `search`, `limit`).
- `POST /api/movements` — Record `INBOUND`, `OUTBOUND`, `ADJUSTMENT`, or `TRANSFER` movement. Supports atomic inter-product transfer via `target_product_id`.
- `POST /api/movements/import` — Bulk import movements from CSV (`file` multipart or `csv_text` JSON; supports `sku`/`target_sku`, `mode`, and `apply_stock`).

## Suppliers (`/api/suppliers`)

- `GET /api/suppliers` — Directory of active suppliers.
- `GET /api/suppliers/<id>` — Supplier profile.
- `POST /api/suppliers` — Register supplier.
- `POST /api/suppliers/import` — Bulk import suppliers from CSV (`file` multipart or `csv_text` JSON; `mode`: `upsert`, `skip`, or `replace`).
- `PUT /api/suppliers/<id>` — Update supplier.
- `DELETE /api/suppliers/<id>` — Delete supplier.

## Inventory & Analytics (`/api/inventory`, `/api/reports`)

- `GET /api/inventory/overview` — Aggregated counts, total valuation, and low/out-of-stock indicators.
- `GET /api/inventory/alerts` — Items breaching safety thresholds.
- `GET /api/inventory/settings` — System configuration keys.
- `PUT /api/inventory/settings` — Update configuration.
- `GET /api/reports/summary` — Category valuation, movement trends, and supplier ratings.
