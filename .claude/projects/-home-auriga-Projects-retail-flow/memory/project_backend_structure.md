---
name: project-backend-structure
description: RetailFlow backend core infrastructure — unfold, communication module, celery, soft-delete, throttles added 2026-06-06
metadata:
  type: project
---

RetailFlow backend has full parity with finance-manager's core infrastructure.

**Why:** User requested the same production-ready backend features in both projects.
**How to apply:** New domain apps should inherit from `core.models.BaseModel` or `SoftDeleteModel`, register admins with `core.admin.BaseModelAdmin`, and use `CommunicationHandler.request_communication(...)` for all outbound messages.

## Core app additions
- `core/models.py` — `BaseModel` (UUID PK + timestamps), `SoftDeleteModel` (soft-delete via `deleted_at`)
- `core/admin.py` — `BaseModelAdmin(unfold.ModelAdmin)` — project-wide admin base with Unfold theme + audit read-only fields
- `core/middleware.py` — `CurrentRequestMiddleware` — stores request in thread-local for signal access
- `core/throttles.py` — `LoginRateThrottle`, `RegisterRateThrottle`, `PasswordResetRateThrottle`, `TokenRefreshRateThrottle`
- `core/responses.py` / `core/exceptions.py` / `core/pagination.py` — top-level re-exports of `core/rest_framework/` internals (needed by DRF settings strings)
- `core/rest_framework/pagination.py` — added `paginate_or_full()` helper

## Settings additions
- `retailflow/settings/theme.py` — Unfold admin theme (green primary palette for retail)
- `retailflow/settings/communication.py` — email/SMTP settings via python-decouple
- `retailflow/settings/base.py` — added: `unfold` in INSTALLED_APPS, `communication` app, `CurrentRequestMiddleware`, production security headers, Celery settings
- `retailflow/settings/rest_framework.py` — added throttle classes + rates
- `retailflow/settings/logging.py` — rotating file handler at `logs/app.log`, LOG_LEVEL env var
- `retailflow/celery.py` + `retailflow/__init__.py` — Celery app wired to Redis

## Communication app (`communication/`)
Full scaffold identical to finance-manager except no company/multi-tenancy (trigger → system → user only).
Retail-specific trigger codes: `LOW_STOCK_ALERT`, `OUT_OF_STOCK_ALERT`, `NEW_SALE_RECORDED`, `SUPPLIER_ORDER_PLACED`, `SUPPLIER_ORDER_RECEIVED`, `PASSWORD_RESET`, `WELCOME_EMAIL`.
- `communication/utils/utils.py` — `CommunicationHandler.request_communication(data, send_immediately, send_in_same_task)`
- `communication/services/` — email (Django EmailMessage), whatsapp (Meta Cloud API), push (firebase-admin optional)
- `communication/tasks.py` — Celery-optional `process_communication_request` task
- `communication/management/commands/` — `process_communication_requests` sweep cron, `send_test_email`, `send_test_push`
- `communication/migrations/0001_initial.py` — applied successfully

## New packages in requirements.txt
`django-unfold>=0.40.0`, `celery>=5.3`, `redis>=5.0`, `requests>=2.31`
`firebase-admin` optional (commented out) — install manually to enable push notifications

## New .env.example keys
`CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_TOKEN_URI`,
`LOG_LEVEL`, `DJANGO_LOG_LEVEL`, `DB_LOG_LEVEL`
