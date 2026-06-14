import json
import logging
import traceback
from datetime import timedelta

from decouple import config
from django.utils import timezone

from communication.constants import (
    COMMUNICATION_REQUESTS_RETRIES,
    COMMUNICATION_REQUESTS_RETRY_TIME_IN_MINUTES,
    DOCUMENT_MESSAGE,
    EMAIL_COMMUNICATION,
    FAILURE_STATUS,
    PUSH_NOTIFICATION_COMMUNICATION,
    RETRY_STATUS,
    STARTED_STATUS,
    SUCCESS_STATUS,
    WHATSAPP_COMMUNICATION,
)
from communication.models import (
    CommunicationPreferences,
    CommunicationRequest,
    CommunicationTriggers,
)

logger = logging.getLogger(__name__)


def _clean_list(items):
    return [x for x in (items or []) if isinstance(x, str) and x.strip()]


def get_communication_preference(trigger_code, user_id=None):
    """Resolve the effective per-channel booleans for one trigger.

    The final value for each channel is the AND of:
      1. CommunicationTriggers.allow_<channel>_communication  (master switch)
      2. The system-default row (trigger=…, user=NULL), if any
      3. The user-level row (trigger=…, user=…), if any

    Returns None if the trigger code isn't registered.
    """
    try:
        trigger = CommunicationTriggers.objects.get(code=trigger_code)
    except CommunicationTriggers.DoesNotExist:
        logger.warning("Unknown communication trigger code: %s", trigger_code)
        return None

    email_ok    = trigger.allow_email_communication
    push_ok     = trigger.allow_notification_communication
    whatsapp_ok = trigger.allow_whatsapp_communication
    if not (email_ok or push_ok or whatsapp_ok):
        return _pref_result(trigger, False, False, False)

    system_pref = CommunicationPreferences.objects.filter(
        trigger=trigger, user__isnull=True
    ).first()
    if system_pref:
        email_ok    = email_ok    and system_pref.allow_email_communication
        push_ok     = push_ok     and system_pref.allow_notification_communication
        whatsapp_ok = whatsapp_ok and system_pref.allow_whatsapp_communication
        if not (email_ok or push_ok or whatsapp_ok):
            return _pref_result(trigger, False, False, False)

    if user_id:
        user_pref = CommunicationPreferences.objects.filter(
            trigger=trigger, user_id=user_id
        ).first()
        if user_pref:
            email_ok    = email_ok    and user_pref.allow_email_communication
            push_ok     = push_ok     and user_pref.allow_notification_communication
            whatsapp_ok = whatsapp_ok and user_pref.allow_whatsapp_communication

    return _pref_result(trigger, email_ok, push_ok, whatsapp_ok)


def _pref_result(trigger, email_ok, push_ok, whatsapp_ok):
    return {
        'trigger': trigger,
        'email_communication': email_ok,
        'notification_communication': push_ok,
        'whatsapp_communication': whatsapp_ok,
    }


class CommunicationHandler:
    """Single entrypoint for sending. Feature code calls
    ``CommunicationHandler.request_communication(data, ...)`` and never touches
    channel services or CommunicationRequest directly."""

    @classmethod
    def request_communication(cls, data: dict, send_immediately: bool = True,
                              send_in_same_task: bool = False):
        """Resolve preferences, create one CommunicationRequest per enabled channel,
        and optionally dispatch them. Returns the list of created requests."""
        trigger_code = data.get('trigger')
        user_id      = data.get('user_id') or None
        user_group   = data.get('user_group')

        pref = get_communication_preference(trigger_code, user_id=user_id)
        if pref is None:
            return []
        trigger = pref['trigger']
        created = []

        emails = _clean_list(data.get('emails'))
        if emails and pref['email_communication']:
            created.append(cls._create_request(
                trigger=trigger,
                communication_type=EMAIL_COMMUNICATION,
                recipients=emails,
                payload={
                    'cc_emails':               _clean_list(data.get('cc_emails')),
                    'subject':                 data.get('email_subject', ''),
                    'title':                   data.get('email_title', ''),
                    'description':             data.get('email_description', ''),
                    'warning':                 data.get('email_warning', ''),
                    'link':                    data.get('email_link', ''),
                    'content_template':        data.get('content_template', False),
                    'content_template_context': data.get('content_template_context', {}),
                    'attachments':             data.get('email_attachments', []),
                },
                user_id=user_id,
                user_group=user_group,
            ))

        mobile_numbers = _clean_list(data.get('mobile_numbers'))
        if mobile_numbers and pref['whatsapp_communication']:
            created.append(cls._create_request(
                trigger=trigger,
                communication_type=WHATSAPP_COMMUNICATION,
                recipients=mobile_numbers,
                payload={
                    'message_type': data.get('whatsapp_message_type', 'TEXT'),
                    'arguments':    data.get('whatsapp_arguments', {}),
                    'template':     trigger.template,
                    'components':   data.get('whatsapp_components', []),
                },
                user_id=user_id,
                user_group=user_group,
            ))

        device_tokens = _clean_list(data.get('device_tokens'))
        if device_tokens and pref['notification_communication']:
            created.append(cls._create_request(
                trigger=trigger,
                communication_type=PUSH_NOTIFICATION_COMMUNICATION,
                recipients=device_tokens,
                payload={
                    'title': data.get('notification_title', ''),
                    'body':  data.get('notification_body', ''),
                    'data':  data.get('notification_data', {}),
                },
                user_id=user_id,
                user_group=user_group,
            ))

        if send_immediately:
            for req in created:
                req.status = STARTED_STATUS
                req.save(update_fields=['status', 'updated_at'])
                if send_in_same_task:
                    cls.send_communication(req)
                else:
                    cls._dispatch_async(req.id)
        return created

    @classmethod
    def send_communication(cls, request_obj: CommunicationRequest):
        """Dispatch a single CommunicationRequest. Updates status/retries/traceback in place."""
        try:
            payload = (
                json.loads(request_obj.data)
                if isinstance(request_obj.data, str)
                else (request_obj.data or {})
            )
            if request_obj.communication_type == EMAIL_COMMUNICATION:
                result = cls._send_email(request_obj, payload)
            elif request_obj.communication_type == WHATSAPP_COMMUNICATION:
                result = cls._send_whatsapp(request_obj, payload)
            elif request_obj.communication_type == PUSH_NOTIFICATION_COMMUNICATION:
                result = cls._send_push(request_obj, payload)
            else:
                raise ValueError(f"Unknown communication_type: {request_obj.communication_type}")
            request_obj.status    = SUCCESS_STATUS
            request_obj.result    = json.dumps(result, default=str)
            request_obj.traceback = None
            request_obj.save(update_fields=['status', 'result', 'traceback', 'updated_at'])
        except Exception as exc:
            request_obj.retries        += 1
            request_obj.traceback       = traceback.format_exc()
            request_obj.retries_reasons = (request_obj.retries_reasons or []) + [str(exc)]
            request_obj.status          = (
                FAILURE_STATUS
                if request_obj.retries >= COMMUNICATION_REQUESTS_RETRIES
                else RETRY_STATUS
            )
            request_obj.next_attempt_time = timezone.now() + timedelta(
                minutes=COMMUNICATION_REQUESTS_RETRY_TIME_IN_MINUTES
            )
            request_obj.save()
            logger.exception("Communication send failed for request %s", request_obj.id)

    @classmethod
    def _create_request(cls, *, trigger, communication_type, recipients, payload,
                        user_id, user_group):
        return CommunicationRequest.objects.create(
            trigger=trigger,
            communication_type=communication_type,
            recipients=recipients,
            data=json.dumps(payload, default=str),
            user_id=user_id,
            user_group=user_group,
        )

    @classmethod
    def _dispatch_async(cls, request_id):
        from communication.tasks import process_communication_request
        process_communication_request.delay(str(request_id))

    @classmethod
    def _send_email(cls, req, payload):
        from communication.services.email import render_email, send_email
        context = {
            'subject':     payload.get('subject', ''),
            'title':       payload.get('title', ''),
            'description': payload.get('description', ''),
            'warning':     payload.get('warning', ''),
            'link':        payload.get('link', ''),
            **(payload.get('content_template_context') or {}),
        }
        template  = payload.get('content_template') or 'email/base_email.html'
        body_html = render_email(template, context)
        return send_email(
            subject=payload.get('subject', ''),
            body_html=body_html,
            recipients=req.recipients,
            cc=payload.get('cc_emails', []),
            attachments=payload.get('attachments', []),
        )

    @classmethod
    def _send_whatsapp(cls, req, payload):
        from communication.services.whatsapp import Meta
        client = Meta(
            access_token=config('WHATSAPP_ACCESS_TOKEN',    default=''),
            phone_number_id=config('WHATSAPP_PHONE_NUMBER_ID', default=''),
        )
        results = []
        for to in req.recipients:
            if payload.get('components'):
                resp = client.send_template_message(to, payload['template'], payload['components'])
            elif payload.get('message_type') == DOCUMENT_MESSAGE:
                args = payload.get('arguments') or {}
                resp = client.send_document_message(to, args.get('url', ''), args.get('caption', ''))
            else:
                args = payload.get('arguments') or {}
                resp = client.send_text_message(to, args.get('message', ''), args.get('preview_url', False))
            if isinstance(resp, dict) and 'error' in resp:
                raise RuntimeError(f"WhatsApp error for {to}: {resp['error']}")
            results.append(resp)
        return results

    @classmethod
    def _send_push(cls, req, payload):
        from communication.services.push_notification import PushNotification
        return PushNotification().send(
            registration_ids=req.recipients,
            title=payload.get('title', ''),
            body=payload.get('body', ''),
            data=payload.get('data', {}),
        )
