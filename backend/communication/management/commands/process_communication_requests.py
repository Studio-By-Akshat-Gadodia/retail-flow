"""Sweep the outbox and dispatch anything pending or due-for-retry.

Schedule this on a cron (every 2–5 minutes). It is the safety net for
``send_immediately=False`` sends and the driver of the retry policy.
"""

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from communication.constants import (
    COMMUNICATION_REQUESTS_RETRIES,
    FAILURE_STATUS,
    PENDING_STATUS,
    RETRY_STATUS,
)
from communication.models import CommunicationRequest
from communication.tasks import process_communication_request


class Command(BaseCommand):
    help = "Dispatch pending / retryable CommunicationRequest rows."

    def handle(self, *args, **options):
        now = timezone.now()
        qs  = CommunicationRequest.objects.filter(
            status__in=[PENDING_STATUS, RETRY_STATUS, FAILURE_STATUS],
            retries__lte=COMMUNICATION_REQUESTS_RETRIES,
        ).filter(Q(next_attempt_time__isnull=True) | Q(next_attempt_time__lte=now))

        count = 0
        for req in qs.iterator():
            process_communication_request.delay(str(req.id))
            count += 1
        self.stdout.write(self.style.SUCCESS(f"Dispatched {count} communication request(s)."))
