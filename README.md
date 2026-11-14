# StockFlow

> **Smart inventory. Simplified operations.**

StockFlow is a full-stack inventory and warehouse management system built for retail shops, warehouses, and small-to-medium businesses. It replaces slow spreadsheets and complex ERP systems with a fast, clean, browser-based dashboard — no installation required for end users.

---

## ✨ Features

| Category | What it does |
|---|---|
| 📦 **Inventory Dashboard** | Live KPIs — total SKUs, stock valuation, low-stock alerts, and out-of-stock counts |
| 🔍 **Product Catalog** | Add, edit, search products by SKU/name; bulk import via CSV; auto-generate SKUs |
| 🔄 **Stock Movements** | Record INBOUND, OUTBOUND, ADJUSTMENT, and TRANSFER movements with full audit trail |
| 🏭 **Supplier Management** | Tier A/B/C supplier directory with lead times, ratings, and contact records |
| 📊 **Reports & Analytics** | Category-wise stock valuation, movement trends, supplier performance summaries |
| 👥 **User Roles** | Admin, Manager, Shopkeeper, Staff — each with scoped access and permissions |
| 🔐 **Authentication** | Secure token-based login with PBKDF2-HMAC-SHA256 password hashing (100K iterations) |
| 🌙 **Dual Themes** | Dark / Light mode toggle — high-contrast dark optimised for warehouse environments |
| 📱 **Mobile Ready** | Fully responsive layout with a bottom-sheet drawer for mobile screens |
| 📋 **Audit Logs** | Every action is timestamped, actor-stamped, and stored for compliance |

---

## 🗂️ Project Structure

```
StockFlow/
├── backend/                # Flask 3.x REST API
│   ├── app.py              # Application factory and server entry point
│   ├── config.py           # Environment configuration
│   ├── database/
│   │   ├── connection.py   # Thread-safe SQLite connection manager (WAL mode)
│   │   ├── schema.sql      # Full DDL — 7 tables with indexes and foreign keys
│   │   └── seed.py         # Auto-seeds default admin account and sample inventory
│   ├── routes/             # Flask Blueprint endpoints
│   │   ├── auth.py         # /api/auth — register, login, logout, profile
│   │   ├── products.py     # /api/products — CRUD + bulk CSV import
│   │   ├── movements.py    # /api/movements — stock ledger + bulk import
│   │   ├── suppliers.py    # /api/suppliers — supplier directory
│   │   ├── inventory.py    # /api/inventory — overview, alerts, settings
│   │   ├── reports.py      # /api/reports — analytics summaries
│   │   ├── orders.py       # /api/orders — purchase & sales order lifecycle
│   │   └── admin.py        # /api/admin — user management, audit logs
│   ├── services/           # Business logic layer (decoupled from HTTP)
│   ├── utils/              # Auth decorators, response helpers, validators
│   └── tests/              # pytest suite — 81 tests, all passing
│
├── frontend/               # Vanilla JS Single-Page Application
│   ├── index.html          # Landing page and router redirect
│   ├── login.html/js/css   # Authentication portal
│   ├── register.html/js/css # New account registration
│   ├── app.html/js/css     # Main workspace shell (hash router, state manager)
│   └── modules/
│       ├── state.js        # Reactive in-memory application state
│       ├── ui.js           # Modals, toasts, and UI utilities
│       ├── formatters.js   # Currency (₹ INR), quantity, and date formatters
│       ├── views-inventory.js    # Product catalog and stock views
│       ├── views-operations.js   # Movements, transfers, supplier operations
│       └── views-admin.js        # User management and system settings
│
├── research/               # UX research artifacts
│   ├── persona.md          # Primary and secondary user personas
│   ├── empathy_map.md      # User empathy mapping (Says / Thinks / Does / Feels)
│   ├── interview_questions.md    # Semi-structured field interview questions
│   ├── questionnaire.md    # User study survey with Likert-scale questions
│   └── research_findings.md      # Key UX insights that shaped design decisions
│
├── docs/                   # Technical documentation
│   ├── API_DOCUMENTATION.md        # Full REST endpoint reference
│   ├── DATABASE_DESIGN.md          # Schema, ER diagram, and index strategy
│   ├── ARCHITECTURE_BLUEPRINT_context.md  # System design and principles
│   ├── PROJECT_OVERVIEW.md         # Quickstart and feature summary
│   └── TESTING_GUIDE.md            # Test coverage and manual verification guide
│
├── instance/
│   └── stockflow.db        # SQLite database (auto-created on first run)
│
├── requirements.txt        # Python dependencies
├── run-stockflow.bat       # One-click launcher for Windows
└── .env.example            # Environment variable reference
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **pip**
- A modern browser (Chrome, Edge, Firefox, Safari)

---

### 1 — Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 2 — Configure Environment *(optional)*

Copy the example environment file and adjust values if needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `FLASK_ENV` | `development` | Flask environment mode |
| `SECRET_KEY` | `dev-secret-key-change-me` | **Change this in production!** |
| `PORT` | `5000` | Server port |

---

### 3 — Start the Server

**Windows (one-click):**
```
double-click run-stockflow.bat
```

**All platforms:**
```bash
python -m backend.app
```

The app auto-creates the database and seeds a default admin account on first launch.

Open your browser at: **[http://localhost:5000](http://localhost:5000)**

---

### 4 — Default Login

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

> ⚠️ Change the admin password immediately after first login.

---

### 5 — Run Tests

```bash
python -m pytest
```

Expected: **81 tests passed** ✅

---

## 🏗️ Architecture

```
Browser (Vanilla ES6 SPA)
        │
        │  HTTP / JSON (REST API)
        ▼
Flask 3.x Backend  (port 5000)
   ├── Blueprint Router  (/api/*)
   ├── Service Layer     (business logic)
   ├── Auth Middleware   (Bearer token + role check)
   └── SQLite (WAL)      (instance/stockflow.db)
```

**Design decisions:**
- **Zero frontend frameworks** — No React, Vue, or bundler. Pure ES6 modules served directly by Flask.
- **Hash-based router** — `#products?q=iphone&page=2` supports deep-linking and browser history.
- **In-memory product cache** — `Map<id, Product>` eliminates redundant API calls for SKU searches.
- **SQLite WAL mode** — Concurrent reads with atomic writes; foreign keys enforced at the PRAGMA level.
- **Service layer** — All business logic lives in `backend/services/`, cleanly decoupled from HTTP routes.

---

## 🔌 API Overview

All responses follow a consistent JSON envelope:

```json
{
  "success": true,
  "data": {},
  "message": "Operation description",
  "status_code": 200
}
```

| Endpoint group | Base path | Description |
|---|---|---|
| Authentication | `/api/auth` | Register, login, logout, profile |
| Products | `/api/products` | CRUD, SKU generation, CSV bulk import |
| Stock Movements | `/api/movements` | Inbound, outbound, transfer, adjustment |
| Suppliers | `/api/suppliers` | Supplier directory, tiers, CSV import |
| Inventory | `/api/inventory` | Live overview, alerts, system settings |
| Reports | `/api/reports` | Analytics, category valuation, trends |
| Orders | `/api/orders` | Purchase and sales order lifecycle |
| Administration | `/api/admin` | User management, roles, audit logs |

Full endpoint reference: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)

---

## 🗄️ Database Schema

The SQLite database contains 7 core tables:

```
users (1) ────< user_sessions (N)
users (1) ────< audit_logs (N)
suppliers (1) ───< products (N)
products (1) ───< movements (N)
system_settings  (key-value store)
```

Passwords are hashed with **PBKDF2-HMAC-SHA256** at **100,000 iterations**. Session tokens are stored server-side with configurable expiry.

Full schema: [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md)

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Admin** | Full system access — users, settings, audit logs, all data |
| **Manager** | Inventory, products, suppliers, movements, reports |
| **Shopkeeper** | Inventory viewing, stock movements, order creation |
| **Staff** | Read-only inventory access |

---

## 🔬 Research Background

This project was designed using human-centered design methodology:

- **Field interviews** with retail merchants and warehouse operators
- **Empathy mapping** to identify real pain points (slow software, missing audit trails, stockout surprises)
- **User personas** representing floor inventory managers and supply chain directors
- **Usability questionnaires** measuring task completion speed and cognitive load

Research artifacts are in the [`research/`](research/) folder.

---

## 🧪 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, Flask 3.x, Flask-CORS |
| Database | SQLite 3 (WAL mode, foreign keys enforced) |
| Frontend | Vanilla HTML5, CSS3 (custom properties), ES6 Modules |
| Auth | PBKDF2-HMAC-SHA256, Bearer tokens |
| Testing | pytest 8.x |
| Hosting | Self-hosted (Flask dev server) / any WSGI server |

---

## 📄 License

This project is built as a prototype and academic demonstration.

---

<div align="center">
  <strong>StockFlow</strong> — Smart inventory. Simplified operations.
</div>
