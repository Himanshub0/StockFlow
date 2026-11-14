# StockFlow Database Design

The persistence tier runs on SQLite 3 with WAL (Write-Ahead Logging) and enforced foreign keys.

## Entity Relationship Summary

```
users (1) ────< user_sessions (N)
users (1) ────< audit_logs (N)
suppliers (1) ───< products (N)
products (1) ───< movements (N)
system_settings (Key-Value)
```

## Tables

### 1. `users`
Stores user identities, credentials, and roles.
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `username` TEXT UNIQUE NOT NULL COLLATE NOCASE
- `email` TEXT UNIQUE NOT NULL COLLATE NOCASE
- `password_hash` TEXT NOT NULL (PBKDF2-HMAC-SHA256 with 100,000 iterations)
- `full_name` TEXT NOT NULL
- `role` TEXT NOT NULL ('admin', 'manager', 'user', 'staff')
- `status` TEXT NOT NULL ('active', 'suspended')
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `last_login` TIMESTAMP

### 2. `user_sessions`
Manages persistent session tokens with expiration timestamps.
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `token` TEXT UNIQUE NOT NULL
- `user_id` INTEGER NOT NULL (FK -> users.id ON DELETE CASCADE)
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `expires_at` TIMESTAMP NOT NULL

### 3. `suppliers`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `code` TEXT UNIQUE NOT NULL COLLATE NOCASE
- `name` TEXT NOT NULL
- `tier` TEXT NOT NULL ('Tier A', 'Tier B', 'Tier C')
- `contact_name` TEXT
- `email` TEXT
- `phone` TEXT
- `lead_time_days` INTEGER DEFAULT 7
- `rating` REAL DEFAULT 4.5
- `status` TEXT NOT NULL ('active', 'inactive')

### 4. `products`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `sku` TEXT UNIQUE NOT NULL COLLATE NOCASE
- `name` TEXT NOT NULL
- `category` TEXT NOT NULL
- `unit_price` REAL NOT NULL DEFAULT 0.0
- `current_stock` INTEGER NOT NULL DEFAULT 0
- `min_stock` INTEGER NOT NULL DEFAULT 10
- `max_stock` INTEGER NOT NULL DEFAULT 500
- `supplier_id` INTEGER (FK -> suppliers.id ON DELETE SET NULL)
- `status` TEXT NOT NULL ('in_stock', 'low_stock', 'out_of_stock')

### 5. `movements`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `product_id` INTEGER NOT NULL (FK -> products.id ON DELETE CASCADE)
- `type` TEXT NOT NULL ('INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER')
- `quantity` INTEGER NOT NULL
- `reference_no` TEXT
- `performed_by` TEXT
- `notes` TEXT
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 6. `audit_logs`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id` INTEGER (FK -> users.id ON DELETE SET NULL)
- `username` TEXT
- `action` TEXT NOT NULL
- `details` TEXT
- `ip_address` TEXT
- `status` TEXT NOT NULL ('success', 'failed', 'warning')
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 7. `system_settings`
- `key` TEXT PRIMARY KEY
- `value` TEXT NOT NULL
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
