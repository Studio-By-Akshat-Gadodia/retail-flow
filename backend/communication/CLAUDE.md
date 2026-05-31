# CLAUDE.md — communication app

The `communication` Django app is the single entrypoint for sending **emails**, **WhatsApp messages**, and **mobile push notifications** out of the system. Callers never talk to SMTP, Meta WhatsApp Cloud API, or FCM directly — they hand a single dict to `CommunicationHandler.request_communication(...)` and the app decides which channels actually fire, persists a `CommunicationRequest` per channel, and dispatches via Celery with retries.

The app has **no public API** of its own (no `api/` package, no REST routes for sending). It is consumed in-process by other apps' views, tasks, services, and management commands.

## Mental model

```
caller dict
   │
   ▼
CommunicationHandler.request_communication(data, send_immediately=?, send_in_same_task=?)
   │
   ├─ get_communication_preference(trigger, company, user)   # 3-level AND of trigger × company × user toggles
   │
   ├─ for each enabled channel (email / whatsapp / push):
   │     CommunicationRequest.objects.create(...)            # one row per channel
   │     └─ process_communication_request.delay(req.id)      # Celery (or inline if send_in_same_task)
   │
   ▼
process_communication_request task
   │
   ▼
CommunicationHandler.send_communication(req)
   ├─ EMAIL       → EmailService (shopfloor.services.email)
   ├─ WHATSAPP    → communication.services.whatsapp.Meta
   └─ PUSH        → communication.services.push_notification.PushNotification (FCM)
        │
        ├─ success → request.status = SUCCESS, request.result = JSON
        └─ failure → request.retries += 1, status = RETRY (or FAILURE if retries ≥ 3),
                     next_attempt_time = now + 15 min, traceback saved
```

A Django management command (`process_communication_requests`) plus a cron sweeps any rows left in `PENDING` / `RETRY` / `FAILURE` (with `retries ≤ COMMUNICATION_REQUESTS_RETRIES`) whose `next_attempt_time` has passed, and re-queues them. This is the safety net for when Celery was down or `send_immediately=False` was used.

## The three models

### 1. `CommunicationTriggers` — the **catalog** of "things the system can send"

Defined in `communication/models.py`. Inherits `BaseModel` (audit fields, soft delete via `HistoryModel`).

```python
class CommunicationTriggers(BaseModel):
    name = CharField(250)
    code = CharField(250, unique=True)              # e.g. 'DAILY_QC_REPORT', 'MACHINE_MAINTENANCE_ASSIGNED'
    template = CharField(250)                       # WhatsApp template name registered with Meta
    description = TextField(250)

    allow_email_communication = BooleanField(default=True)            # channel ON/OFF at trigger level
    allow_notification_communication = BooleanField(default=False)
    allow_whatsapp_communication = BooleanField(default=False)

    default_allow_email_communication_value = BooleanField(default=True)         # default copied into
    default_allow_notification_communication_value = BooleanField(default=True)  # new CommunicationPreferences
    default_allow_whatsapp_communication_value = BooleanField(default=True)
```

- `code` is the **stable string identifier** callers pass as `data['trigger']`. All known codes live in `communication/constants.py` (e.g. `DAILY_QC_REPORT`, `MACHINE_MAINTENANCE_ASSIGNED`, `AQL_REPORT`, `END_OF_DAY_REPORT`, …). Adding a new trigger means: add a constant, add a `CommunicationTriggers` row (via migration / data fixture / admin), and reference the constant from the caller.
- `allow_*_communication` flags are the **master switch**. If `allow_whatsapp_communication=False` on the trigger, no WhatsApp will ever go out for it, regardless of company/user preferences.
- `default_allow_*_communication_value` are seed values used when a new `CommunicationPreferences` row is created for a company/user.
- `template` is the WhatsApp Cloud API template name. When the caller passes `whatsapp_components`, the trigger's `template` is sent to Meta as the template name.

### 2. `CommunicationPreferences` — per-trigger, per-company, optionally per-user opt-ins

```python
class CommunicationPreferences(Model):
    trigger = FK(CommunicationTriggers)
    company = FK(Company)
    user    = FK(User, null=True, blank=True)        # NULL row = company-level default

    allow_email_communication        = BooleanField(default=True)
    allow_notification_communication = BooleanField(default=True)
    allow_whatsapp_communication     = BooleanField(default=True)

    user_can_specify_communication   = BooleanField(default=True)   # if False, user-level rows ignored

    class Meta:
        constraints = [UniqueConstraint(fields=['trigger_id', 'company', 'user'],
                                        name='unique_communication_preference')]
```

**Resolution rule** (see `get_communication_preference` in `communication/utils/utils.py`) — for each channel, the final boolean is the **AND** of three layers, computed in order, short-circuiting on the first `False`:

1. `CommunicationTriggers.allow_<channel>_communication` (the trigger's master switch)
2. The company-level `CommunicationPreferences` row (`trigger=…, company=…, user=NULL`), if any
3. The user-level `CommunicationPreferences` row (`trigger=…, company=…, user=…`), if any

If any layer returns all-False the function exits early. The function returns:

```python
{
    'trigger': <CommunicationTriggers>,        # resolved instance, used downstream for `template`
    'email_communication': bool,
    'notification_communication': bool,
    'whatsapp_communication': bool,
}
```

Two proxy models — `CompaniesCommunicationPreferences(Company)` and `UsersCommunicationPreferences(User)` — exist purely to give the Django admin two separate change pages (one for editing a company's preferences across all triggers, one for a user's) without duplicating the underlying table. Their `save()` is overridden to `pass` — the inlines on these admin pages write the real `CommunicationPreferences` rows.

### 3. `CommunicationRequest` — the **outbox / audit log / retry queue**

```python
class CommunicationRequest(Model):
    task_id            = UUIDField(default=uuid4)
    trigger            = FK(CommunicationTriggers)
    communication_type = CharField(choices=[EMAIL, WHATSAPP, PUSH_NOTIFICATION], default=EMAIL)
    status             = SmallIntegerField(choices=[PENDING, STARTED, SUCCESS, RETRY, FAILURE], default=PENDING)

    recipients = JSONField(default=list)        # list[str] — emails OR phone numbers OR FCM device tokens
    data       = TextField(default=dict)        # JSON-encoded channel-specific payload (see below)

    created_at         = DateTimeField(auto_now_add=True)
    updated_at         = DateTimeField(auto_now=True)
    next_attempt_time  = DateTimeField(null=True)         # set on failure: now + COMMUNICATION_REQUESTS_RETRY_TIME_IN_MINUTES
    result             = TextField(null=True, blank=True) # JSON of provider response on success
    traceback          = TextField(null=True, blank=True) # last exception traceback on failure
    retries            = IntegerField(default=0)
    retries_reasons    = JSONField(default=list)

    company    = FK(Company, null=True, blank=True)
    user       = FK(User,    null=True, blank=True)
    user_group = CharField(255, null=True, blank=True)
```

Status constants come from `logs_manager.constants`: `PENDING_STATUS`, `STARTED_STATUS`, `SUCCESS_STATUS`, `RETRY_STATUS`, `FAILURE_STATUS`.

**Important invariants:**

- **One channel = one row.** A single `request_communication(...)` call can fan out into up to three `CommunicationRequest` rows (email + whatsapp + push) — one per enabled channel.
- `data` is a `TextField` storing JSON (not a `JSONField`) — load with `json.loads(req.data)` and save with `json.dumps(...)`. The shape of the inner dict depends on `communication_type`:

  - **Email** `data`:
    ```python
    {
      'cc_emails': [..],
      'subject': str, 'title': str, 'company': str, 'location': str,
      'description': str, 'warning': str, 'link': str,
      'content_template': str | False,            # optional custom template, defaults to base_email.html
      'content_template_context': {...},          # merged into the template render context
      'attachments': [filepath, ...],
    }
    ```
  - **WhatsApp** `data`:
    ```python
    {
      'message_type': 'TEXT' | 'DOCUMENT',        # only used when 'components' is absent
      'arguments': {...},                          # type-specific args (see below)
      'template': trigger.template,                # template name from the trigger
      'components': [...],                         # if non-empty, a templated message is sent
    }
    ```
  - **Push** `data`:
    ```python
    {
      'title': str, 'body': str,
      'data': {...},                              # arbitrary payload delivered to the app
      'app_type': 'SFC' | 'QC',                   # routes to supervisor app vs QC app FCM project
    }
    ```
- The retry policy is enforced inside `CommunicationHandler.send_communication`:
  - On exception: `retries += 1`, `next_attempt_time = utcnow() + COMMUNICATION_REQUESTS_RETRY_TIME_IN_MINUTES` (15 min default), status becomes `RETRY` until `retries >= COMMUNICATION_REQUESTS_RETRIES` (3 default) at which point it becomes `FAILURE`.
  - The management command `process_communication_requests` picks up anything in `PENDING`/`RETRY`/`FAILURE` with `retries ≤ COMMUNICATION_REQUESTS_RETRIES` and `next_attempt_time` past — schedule it as a cron (every few minutes).
- The admin exposes a `retry_communication_request/<id>/` URL (wired in `communication/urls.py`) for manual reprocessing of failed rows.

### 4. `ScheduledCommunicationJob` (bonus)

A `CompanyBaseModel` (multi-tenant) that ties a **report entity** (GenericForeignKey via `ContentType`) to a recurring schedule (DAILY / WEEKLY / BI_WEEKLY / MONTHLY at a given `time`) plus a set of recipient `users`, `groups`, raw `emails`, `mobile_numbers`, and report filters (`locations`, `shifts`, `floors`, `lines`, `operations`). A scheduler iterates due jobs, runs the report builder, uploads the file to S3, and then calls `CommunicationHandler.request_communication(...)` with the trigger configured for that report. Touch only if you also need scheduled report delivery — for ad-hoc sends use `request_communication` directly.

## How to send a communication

**Always** go through `CommunicationHandler.request_communication(data, send_immediately=?, send_in_same_task=?)`. Never construct `CommunicationRequest` directly, and never call the channel services (`EmailService`, `Meta`, `PushNotification`) directly from feature code — bypassing the handler skips preference resolution, persistence, and retries.

### Call signature

```python
from communication.utils import CommunicationHandler

CommunicationHandler.request_communication(
    data,
    send_immediately=False,   # if True, set status=STARTED and enqueue Celery task right away
                              # if False, status=PENDING — the cron sweep will pick it up later
    send_in_same_task=False,  # if True, run process_communication_request() inline (no Celery hop)
                              # useful inside a Celery task that already has request context / DB tx
)
```

The three flags interact as follows:

| `send_immediately` | `send_in_same_task` | Behavior |
|---|---|---|
| `False` | `*` | Row written as `PENDING`. The `process_communication_requests` cron will dispatch it next sweep. |
| `True` | `False` | Row written as `STARTED`. `process_communication_request.delay(req.id)` is enqueued — sent by a Celery worker. |
| `True` | `True` | Row written as `STARTED`. `process_communication_request(req.id)` is called **inline** in the current process — no Celery hop. |

### The unified `data` dict

`request_communication` takes a **flat dict** that may contain fields for any combination of channels. The handler picks out only the fields relevant to each enabled channel.

```python
data = {
    # --- required for ALL channels ---
    'trigger':    'MACHINE_MAINTENANCE_ASSIGNED',   # one of the codes in communication/constants.py
    'company_id': company.id,                       # 0/None allowed for system-level sends (e.g. SEA_REPORTS)
    'user_id':    user.id,                          # 0/None allowed
    'user_group': user.role,                        # free-form string, stored on CommunicationRequest

    # --- EMAIL channel (only fires if `emails` is non-empty AND preference allows email) ---
    'emails':         ['a@x.com', 'b@x.com'],
    'cc_emails':      ['c@x.com'],
    'email_subject':  'Subject line',
    'email_title':    'Heading rendered into the template',
    'email_company':  str(company),
    'email_location': 'Plant A',
    'email_description': 'Body paragraph',
    'email_warning': 'Note: this link expires in 24h',
    'email_link':     'https://…/report.pdf',
    'content_template':         'aql/email/inspection_complete.html',   # optional override of email/base_email.html
    'content_template_context': {...},                                   # merged into the render context
    'email_attachments': ['/abs/path/to/file.pdf'],

    # --- WHATSAPP channel (only fires if `mobile_numbers` non-empty AND preference allows whatsapp) ---
    'mobile_numbers': ['+919999999999'],
    # Path A: send a Meta template (preferred — Meta requires templated messages outside the 24h session)
    'whatsapp_components': [                       # if present, template is used; trigger.template is the name
        {'type': 'header', 'parameters': [...]},
        {'type': 'body',   'parameters': [...]},
        {'type': 'button', 'sub_type': 'url', 'index': '0', 'parameters': [...]},
    ],
    # Path B: send a freeform text or document (only inside an open 24h session)
    'whatsapp_message_type': 'TEXT',               # or 'DOCUMENT'
    'whatsapp_arguments': {                        # for TEXT: {'message': '...', 'preview_url': True}
        'message': 'Hello',                        # for DOCUMENT: {'url': 's3url', 'caption': '...'}
        'preview_url': True,
    },

    # --- PUSH channel (only fires if `device_tokens` non-empty AND preference allows notification) ---
    'device_tokens':       ['fcm_token_1', 'fcm_token_2'],
    'notification_title':  'New Maintenance Assigned',
    'notification_body':   'You have been assigned …',
    'notification_data':   {'user_role': user.role, 'maintenance_id': maintenance.id},
    'notification_app_type': 'SFC',                # 'SFC' (supervisor app) or 'QC' (QC app) — selects the FCM project
}

CommunicationHandler.request_communication(data, send_immediately=True)
```

**Rules of thumb:**

- Channels are independently opt-in via the recipient field: omit `emails` → no email row is written; omit `mobile_numbers` → no whatsapp row; omit `device_tokens` → no push row. Empty/whitespace-only entries are filtered out.
- The `trigger` code must already exist in `CommunicationTriggers` (typically seeded via migration). The trigger's `allow_*` flags are the master switch; even if you provide `emails` the email row is skipped when `allow_email_communication=False` on the trigger.
- Per-channel preferences cascade: trigger → company → user. If a company has set `allow_whatsapp_communication=False` for that trigger, no WhatsApp will go out for any user in that company.
- For sends with no company context (system-wide jobs, e.g. the `SEA_REPORTS` email-only API), pass `company_id=0` and skip user fields.
- Email template defaults to `email/base_email.html`. To use a custom template, pass `'content_template': 'app/email/foo.html'` plus any vars in `'content_template_context'`. Both `email_*` top-level fields and `content_template_context` end up in the same render context.
- WhatsApp `whatsapp_components` follows the Meta Cloud API template component structure (header / body / button objects with typed `parameters`). The template name itself comes from `CommunicationTriggers.template`.
- For push notifications, pick `notification_app_type` to match where the device token came from — `SFC` for supervisor app, `QC` for QC app. They are wired to **separate Firebase projects** via env vars.
- Long-running senders (Celery tasks, management commands) should pass `send_in_same_task=True` to avoid spawning a sub-task per request; one-off interactive sends (a view handler) should pass `send_immediately=True` and let Celery handle the hop.

### Minimal examples

Send an email only (system-level, no company):

```python
CommunicationHandler.request_communication({
    'trigger': SEA_REPORTS,
    'emails':  [user_email],
    'email_subject':     subject,
    'email_title':       subject,
    'email_description': f"Find below the link for the {report_name} report.",
    'email_warning':     f'Note: This link will expire in {DEFAULT_TIME}',
    'email_link':        report_url,
}, send_immediately=True)
```

Fan-out across all three channels (e.g. machine-maintenance assignment to a mechanic):

```python
CommunicationHandler.request_communication({
    'trigger':    MACHINE_MAINTENANCE_ASSIGNED,
    'company_id': mechanic.company_id,
    'user_id':    mechanic.id,
    'user_group': mechanic.role,

    'emails': [mechanic.email] if mechanic.email else [],
    'email_subject':     'New maintenance assigned',
    'email_title':       'New maintenance assigned',
    'email_description': f'You have been assigned machine {maintenance.machine}.',

    'mobile_numbers': [mechanic.mobile] if mechanic.mobile else [],
    'whatsapp_components': [ ... ],     # template-shaped components matching trigger.template

    'device_tokens': [mechanic.device_token] if mechanic.device_token else [],
    'notification_title': 'New Maintenance Assigned',
    'notification_body':  f'You have been assigned a new maintenance task by {requester.name}.',
    'notification_data':  {'user_role': mechanic.role},
    'notification_app_type': SFC_APP,
}, send_immediately=True)
```

## `communication/services/` — the channel adapters

These are thin wrappers around the upstream provider SDKs. They are **internal**: only `CommunicationHandler` should call them. Code outside the communication app should never import them directly.

### `services/whatsapp.py` — Meta WhatsApp Cloud API client

- `Meta(access_token, phone_number_id)` is the client. A module-level `meta_client = Meta(...)` is built from env vars `WA_ACCESS_TOKEN` / `WA_PHONE_NUMBER_ID` (and inside `CommunicationHandler.send_whatsapp` a fresh client is built per call from `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` — keep both env vars set).
- Built from two mixins:
  - `MessagesMixin` — `send_text_message`, `send_image_message`, `send_video_message`, `send_document_message`, `send_audio_message`, `send_location_message`, `send_contact_message`, `send_template_message`, `send_interactive_message`. Each composes a payload dict and posts to `https://graph.facebook.com/v20.0/{phone_number_id}/messages`.
  - `MetaWebhookResponseMixin` — `get_status(data)` and `get_messages(data)` parse inbound webhook payloads into `WebhookStatusResponse` / `WebhookMessageResponse` dataclasses (defined at the top of the module).
- `upload_media(file_path, media_type)` and `get_media(media_id)` / `download_media(media_url)` handle media uploads + retrieval.
- All payloads use `messaging_product: 'whatsapp'`, `recipient_type: 'individual'`. Responses are returned raw (`requests.post(...).json()`); the handler checks for an `'error'` key and raises if present so the request goes into RETRY.

### `services/push_notification.py` — FCM (Firebase Cloud Messaging) client

- `PushNotification()` constructs **two** `FCMNotification` clients on init — one for the supervisor app, one for the QC app. Each pulls a service-account credential from env vars:
  - `SUPERVISOR_APP_FIREBASE_PROJECT_ID`, `SUPERVISOR_APP_FIREBASE_PRIVATE_KEY`, `SUPERVISOR_APP_FIREBASE_CLIENT_EMAIL`
  - `QC_APP_FIREBASE_PROJECT_ID`, `QC_APP_FIREBASE_PRIVATE_KEY`, `QC_APP_FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_TOKEN_URI` (shared)
- Public methods: `send_fcm_data_notification(registration_ids, data_message)` (supervisor app) and `send_qc_app_fcm_data_notification(registration_ids, data_message)` (QC app). Both accept a list of FCM device tokens and a `data_message` dict with `title`, `body`, `data`. They build the per-device params and call `async_notify_multiple_devices`.
- The two apps differ slightly in payload shape — supervisor wraps the notification metadata under `data_payload.notification` as a JSON string; QC sends `title`/`body` directly at `data_payload` top level. Don't merge them.

### Email is `shopfloor.services.email.EmailService` (not under `communication/services/`)

The email channel is delegated to the project's `EmailService` in `shopfloor/services/email.py`. The handler:

1. Renders `email/base_email.html` (or `content_template` if supplied) with the merged context.
2. Builds an `EmailService` instance, sets `content_subtype='html'`, the subject, content, recipients, CC, and attachments.
3. Calls `email_service.send_email()`.

## `communication/utils/`

- `utils/utils.py` — defines `CommunicationHandler` (the entrypoint described above) and `get_communication_preference(trigger_code, company_id, user_id)` (the cascade resolver). Both are re-exported at `communication.utils` so most code does `from communication.utils import CommunicationHandler`.
- `utils/notification_utils.py` — small helpers that build domain-specific push payloads (e.g. `send_update_qc_notification`) and call `PushNotification` directly. These bypass `CommunicationRequest` and exist for low-latency device-sync nudges (no audit log, no retries) — don't add new ones unless the message genuinely shouldn't be persisted. New code should go through `CommunicationHandler.request_communication`.

## `communication/tasks.py` — Celery tasks

- `process_communication_request(request_object_id, company_id=None)` — the worker side of the queue. Loads the `CommunicationRequest` and calls `CommunicationHandler.send_communication(req)`, which dispatches by `communication_type` and updates status. Idempotent on success; safe to re-run failed rows.
- `process_scheduled_report_job(job_id, company_id=None)` — for the `ScheduledCommunicationJob` cron path; builds the report file, uploads to S3, then calls `request_communication`.

## Management commands

- `process_communication_requests` — sweeps the outbox for `PENDING` / `RETRY` / `FAILURE` (with `retries ≤ COMMUNICATION_REQUESTS_RETRIES`) where `next_attempt_time` is past, and enqueues each via `process_communication_request.delay(...)`. **Schedule this on a cron** (every 2–5 min) — it's the safety net for any send that wasn't `send_immediately=True`, and the retry driver for failed sends.
- `send_whatsapp_template_message` — utility for ad-hoc / debug WhatsApp template sends.

## Key constants (`communication/constants.py`)

- **Trigger codes** — one per business event (e.g. `DAILY_QC_REPORT`, `MACHINE_MAINTENANCE_ASSIGNED`, `AQL_REPORT`, `END_OF_DAY_REPORT`, `STYLE_INTEGRATION_FAILURE`, …). Adding a new send requires adding a code here **and** seeding a `CommunicationTriggers` row.
- **Channel codes** — `EMAIL_COMMUNICATION = 'EMAIL'`, `WHATSAPP_COMMUNICATION = 'WHATSAPP'`, `PUSH_NOTIFICATION_COMMUNICATION = 'PUSH_NOTIFICATION'`.
- **WhatsApp message types** — `TEXT_MESSAGE = 'TEXT'`, `DOCUMENT_MESSAGE = 'DOCUMENT'` (used in `data['whatsapp_message_type']`).
- **Push app types** — `SFC_APP = 'SFC'`, `QC_APP = 'QC'` (used in `data['notification_app_type']`).
- **Retry tuning** — `COMMUNICATION_REQUESTS_RETRIES = 3`, `COMMUNICATION_REQUESTS_RETRY_TIME_IN_MINUTES = 15`.
- **Schedule frequencies** — `SCHEDULED_COMMUNICATION_JOB_FREQUENCY_DAILY/WEEKLY/BI_WEEKLY/MONTHLY` for `ScheduledCommunicationJob`.

## Required environment variables

```
# Meta WhatsApp Cloud API
WA_ACCESS_TOKEN=...
WA_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...        # used by CommunicationHandler.send_whatsapp
WHATSAPP_PHONE_NUMBER_ID=...

# FCM — supervisor (SFC) app
SUPERVISOR_APP_FIREBASE_PROJECT_ID=...
SUPERVISOR_APP_FIREBASE_PRIVATE_KEY=...
SUPERVISOR_APP_FIREBASE_CLIENT_EMAIL=...

# FCM — QC app
QC_APP_FIREBASE_PROJECT_ID=...
QC_APP_FIREBASE_PRIVATE_KEY=...
QC_APP_FIREBASE_CLIENT_EMAIL=...

# FCM — shared
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

Email transport credentials are configured by `shopfloor.services.email.EmailService` / Django's email settings — not by this app.

## Adding a new send — checklist

1. Add a trigger code constant in `communication/constants.py`.
2. Create the `CommunicationTriggers` row (data migration or admin), setting `code`, `name`, `template` (if WhatsApp), and the `allow_*` master switches you want enabled.
3. At the call site, build the unified `data` dict (include only the channel fields you intend to send), and call `CommunicationHandler.request_communication(data, send_immediately=True)` (or `send_in_same_task=True` if you're already inside a Celery task).
4. Ensure the `process_communication_requests` cron is running so retries and any `PENDING` rows are dispatched.
5. For new WhatsApp templates, register the template with Meta first and store its name in `CommunicationTriggers.template`.
