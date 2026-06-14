"""Worker entrypoints. Celery is optional — when it's not installed the
exposed callables fall back to running inline so callers don't have to branch."""

import logging

from communication.models import CommunicationRequest

logger = logging.getLogger(__name__)


def _run(request_object_id):
    from communication.utils import CommunicationHandler  # late import — avoid cycles
    try:
        req = CommunicationRequest.objects.get(id=request_object_id)
    except CommunicationRequest.DoesNotExist:
        logger.warning("CommunicationRequest %s not found", request_object_id)
        return
    CommunicationHandler.send_communication(req)


try:
    from celery import shared_task

    @shared_task(name='communication.process_communication_request')
    def process_communication_request(request_object_id):
        _run(request_object_id)

except ImportError:
    def process_communication_request(request_object_id):
        _run(request_object_id)

    def _delay(request_object_id):
        return process_communication_request(request_object_id)

    process_communication_request.delay = _delay  # type: ignore[attr-defined]
