---
name: feedback-base-model-pattern
description: Domain models inherit BaseModel/SoftDeleteModel; admins inherit BaseModelAdmin; never return raw DRF Response
metadata:
  type: feedback
---

All domain models must inherit from `core.models.BaseModel` (standard) or `core.models.SoftDeleteModel` (if soft-delete needed). Never use `models.Model` directly.

**Why:** Ensures UUID PKs and `created_at`/`updated_at` on every table, consistent soft-delete behaviour across the project.
**How to apply:** `class MyModel(BaseModel)` or `class MyModel(SoftDeleteModel)` at the top of each app's `models.py`.

All admin registrations must inherit from `core.admin.BaseModelAdmin` for the Unfold theme and read-only audit fields.

All views must use `APIResponse.success(...)` or `APIResponse.failed(...)` — never return raw `Response(...)`.

All outbound messages (email / push / WhatsApp) must go through `CommunicationHandler.request_communication(data)` — never call channel services directly.
