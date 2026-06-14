"""Lightweight push-only helpers that bypass CommunicationRequest.

Prefer ``CommunicationHandler.request_communication`` for anything that should
be persisted / retried. These helpers exist for low-latency device sync nudges
where an audit row would be noise; they have no retry policy.
"""

import logging

from communication.services.push_notification import PushNotification

logger = logging.getLogger(__name__)


def send_quick_push(device_tokens, title: str, body: str, data: dict | None = None):
    try:
        return PushNotification().send(device_tokens, title, body, data or {})
    except Exception:
        logger.exception("send_quick_push failed")
        return None
