# CLAUDE.md — backend

Django + DRF backend for RetailFlow. This file applies to all code under `backend/`. See the repo root `CLAUDE.md` for project context and `core/CLAUDE.md` for shared utility conventions.

## Settings split

`backend/<project>/settings/` is a package, not a single file:

- `base.py` — default settings, imported by everything else
- `logging.py` — logging config
- `rest_framework.py` — DRF config (includes `EXCEPTION_HANDLER` and `DEFAULT_PAGINATION_CLASS` pointing into `core/`)
- `swagger.py` — Swagger / OpenAPI config

`settings/__init__.py` composes these — typically `from .base import *` then importing the others, or by selecting an env-specific module.

## URL split

`backend/<project>/urls/` is also a package:

- `urls/admin.py` — admin routes
- `urls/api.py` — API routes (mounts each app's `api.v<N>.urls` under `/api/v<N>/<app_name>/`)
- `urls/__init__.py` — combines both into the root `urlpatterns`

## Per-app API versioning

Every Django app owns its API surface under an `api/` package, with one subpackage per version:

```
backend/<app>/
  api/
    v1/
      urls.py
      views.py
      serializers.py
    v2/
      urls.py
      views.py
      serializers.py
```

**URL convention:** every endpoint resolves to `/api/v<N>/<app_name>/<api_path>`. Wiring happens in `urls/api.py`; per-app `api/v<N>/urls.py` defines only the routes within that app/version.

When adding a new endpoint, pick the right version package (or create the next `v<N>/` if the change is breaking) — never add new routes to an old version unless it's an additive fix.

## Config via python-decouple

- Use [`python-decouple`](https://pypi.org/project/python-decouple/) to read all environment-dependent settings.
- `backend/.env` — actual values, **gitignored**.
- `backend/.sample.env` — committed template with every key the app reads (empty or placeholder values). Keep it in sync with `.env` whenever a new config key is added.
- In `settings/base.py`: `from decouple import config` and read with `config("KEY", default=..., cast=...)`.

## `.gitignore`

Must exclude `venv/` / `.venv/` and `.env`, and must **not** exclude `.sample.env` (it ships with the repo). Also exclude `__pycache__/`, `*.pyc`, `db.sqlite3`, `staticfiles/`, `media/`.

## Commands

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .sample.env .env              # then fill in values
python manage.py migrate
python manage.py runserver
python manage.py createsuperuser
```

### Tests

```bash
cd backend
pytest                                       # all tests
pytest <app>/                                # single app's suite
pytest <app>/tests/test_x.py::test_name      # single test
pytest -k "low_stock"                        # by keyword
```

## Suggested apps

- `core/` — shared utilities; see `core/CLAUDE.md`. No API surface of its own.
- Domain apps with their own `api/v<N>/`: `products/`, `stock/`, `suppliers/`, `sales/`, `alerts/`, `exports/`.

## Domain notes

- **Inventory accuracy:** stock-quantity mutations must be transactional (`select_for_update` inside `transaction.atomic`) to avoid race conditions when multiple users update the same SKU.
- **Low-stock alerts:** prefer on-read (cheap, real-time) over a background job for a small-business tool; revisit if computation becomes expensive.
- **Exports:** CSV via stdlib `csv`; for PDF pick one of `reportlab` or `weasyprint` (HTML→PDF) and stick with it.
