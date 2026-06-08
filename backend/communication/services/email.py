"""Django email helpers. Uses whatever EMAIL_BACKEND is configured."""

from typing import Iterable

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string


def render_email(template: str, context: dict | None) -> str:
    return render_to_string(template, context or {})


def send_email(
    *,
    subject: str,
    body_html: str,
    recipients: Iterable[str],
    cc: Iterable[str] | None = None,
    attachments: Iterable[str] | None = None,
) -> dict:
    """Send an HTML email. Returns a receipt dict stored on CommunicationRequest.result."""
    msg = EmailMessage(
        subject=subject,
        body=body_html,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        to=list(recipients or []),
        cc=list(cc or []),
    )
    msg.content_subtype = 'html'
    for path in attachments or []:
        msg.attach_file(path)
    sent = msg.send(fail_silently=False)
    return {'sent_to': list(recipients or []), 'cc': list(cc or []), 'count': sent}
