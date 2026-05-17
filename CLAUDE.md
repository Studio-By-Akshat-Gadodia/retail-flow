# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**RetailFlow** — an inventory manager for small businesses. Scope:

- Product catalog
- Stock update workflow
- Low-stock alerts
- Supplier management
- Sales reporting dashboard
- CSV/PDF export
- Inventory-accuracy tests

## Stack

- **Backend:** Django + DRF, SQLite for dev / Postgres for prod.
- **Frontend:** React, delivered as a PWA (installable, offline-capable). Talks to Django over a JSON API.
- **Python tooling:** `pip` + `requirements.txt`, standard `venv`.
- **Tests:** `pytest`.

## Repository layout

Monorepo:

```
backend/    Django + DRF API
frontend/   React PWA
```

`main.py` and `.idea/` at the repo root are an unused PyCharm stub and can be removed once `backend/` is scaffolded.

## Current state

The repository is in **early scaffolding** — `backend/` and `frontend/` do not exist yet. Conventions below are aspirational until the directories are created.

## Where to look

Per-area conventions live alongside the code; Claude Code auto-loads the nested `CLAUDE.md` when working in that subtree:

- `backend/CLAUDE.md` — Django project layout, settings/URL split, API versioning, env config, gitignore, test commands.
- `backend/core/CLAUDE.md` — the shared `core` app: `APIResponse`, global exception handler, paginator.
- `frontend/CLAUDE.md` — React + PWA conventions, offline-first stock updates, API client.

Per-domain-app `CLAUDE.md` files (e.g. `backend/stock/CLAUDE.md`) will be added when each app is scaffolded — keep them focused on app-specific rules, not project-wide ones.

## Project-wide invariants

- **API boundary:** Django serves JSON only — no server-rendered pages. All UI is React.
- **Uniform API response shape.** Every response (success or error) goes through `core.responses.APIResponse`. Details in `backend/core/CLAUDE.md`.
- **Inventory accuracy is non-negotiable.** Stock-quantity mutations must be transactional. See `backend/CLAUDE.md` (Domain notes) and the future `backend/stock/CLAUDE.md`.
- **PWA offline-first** for the warehouse floor (spotty wifi). Stock updates queue locally and sync. See `frontend/CLAUDE.md`.

## Suggested Django apps

- `core/` — shared utilities. No API surface of its own.
- Domain apps, each with its own `api/v<N>/`: `products/`, `stock/`, `suppliers/`, `sales/`, `alerts/`, `exports/`.
