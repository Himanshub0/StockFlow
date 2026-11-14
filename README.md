# StockFlow

StockFlow is an inventory and stock management prototype.

## Project Structure

```text
StockFlow/
├── frontend/          # Web frontend (HTML, CSS, Vanilla JS modules)
│   ├── modules/       # Views (inventory, operations, admin) and state manager
│   ├── app.html       # Main application workspace
│   └── login.html     # Authentication portal
├── backend/           # Flask REST API backend
│   ├── database/      # SQLite connection, schema, and seed scripts
│   ├── routes/        # API route blueprints
│   ├── services/      # Business logic layer
│   ├── utils/         # Validators, auth decorators, and response helpers
│   └── tests/         # Unit and integration test suites
├── docs/              # System documentation, DB design, API spec, testing guide
├── instance/          # SQLite database storage (stockflow.db)
├── requirements.txt   # Python backend dependencies
├── .env.example       # Example environment variables
├── .gitignore         # Git ignore rules
└── README.md          # Project overview
```
