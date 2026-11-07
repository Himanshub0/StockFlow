# StockFlow

StockFlow is an inventory and stock management prototype.

## Project Structure

```text
StockFlow/
├── frontend/          # Web frontend (HTML, CSS, Vanilla JS)
│   ├── assets/        # Images, icons, and fonts
│   ├── css/           # Main styling, layout, variables, and page-specific styles
│   └── js/            # Client logic, router, API clients, components, and pages
├── backend/           # Flask API backend
│   ├── database/      # SQLite connection, schema, and seed scripts
│   ├── routes/        # API route blueprints
│   ├── services/      # Business logic layer
│   ├── utils/         # Validators and API response helpers
│   └── tests/         # Unit and integration test suites
├── analysis/          # Analytical scripts, stats, and testing templates
├── research/          # UX research, interviews, empathy maps, and personas
├── docs/              # System documentation, DB design, API spec, testing guide
├── instance/          # Database instances
├── requirements.txt   # Python backend dependencies
├── .env.example       # Example environment variables
├── .gitignore         # Git ignore rules
└── README.md          # Project overview
```
