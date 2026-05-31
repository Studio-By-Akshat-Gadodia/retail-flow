# CLAUDE.md — core app

The `core` Django app holds project-wide utilities every other app depends on. It has **no API surface of its own** — no `api/` package, no routes.

## Uniform response shape

Every API response in the project is exactly:

```text
{"status": "success" | "failed", "data": <payload>}
```

No top-level extras, no per-endpoint variations.

## `APIResponse` class

Lives in `core/responses.py`. Exposes two class/static methods:

- `APIResponse.success(data=..., status_code=200)` → DRF `Response` with `{"status": "success", "data": data}`.
- `APIResponse.failed(data=..., status_code=400)` → DRF `Response` with `{"status": "failed", "data": data}`. `data` carries error details / validation errors.

**Views must never return a raw DRF `Response`** — always go through `APIResponse` so the contract holds.

## Global exception handler

`core/exceptions.py::global_exception_handler` — register in `settings/rest_framework.py`:

```python
REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "core.exceptions.global_exception_handler",
    # ...
}
```

The handler must:

1. Call DRF's default `exception_handler(exc, context)` first to translate known exceptions (`ValidationError`, `NotAuthenticated`, `PermissionDenied`, `Http404`, etc.) into a response.
2. Re-wrap that response — and any unhandled exception — through `APIResponse.failed(...)` so every error path emits `{"status": "failed", "data": ...}`.

This guarantees framework-level errors (400/401/403/404/500) match the project's response contract; clients never see DRF's raw error format.

## Paginator

`core/pagination.py::StandardPaginator` — subclass DRF's `PageNumberPagination`, override `get_paginated_response(data)` to return through `APIResponse.success(...)`. Wire as the project default in `settings/rest_framework.py`:

```python
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPaginator",
    # ...
}
```

Paginated payload sits inside `data` and exposes **only** these five keys:

```json
{
  "status": "success",
  "data": {
    "total_count": 123,
    "total_pages": 13,
    "current_page": 2,
    "page_size": 10,
    "results": [{"id": 1, "name": "Widget"}, {"id": 2, "name": "Gadget"}]
  }
}
```

Key names are fixed: `total_count`, `total_pages`, `current_page`, `page_size`, `results`. No `next` / `previous` URLs, no top-level `count` — DRF's default shape is intentionally replaced.

`page_size` is configurable per-view and overridable via a `?page_size=` query param; cap the max in the paginator class.
