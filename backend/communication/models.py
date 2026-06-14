import uuid

from django.conf import settings
from django.db import models

from core.models import BaseModel

from .constants import (
    CHANNEL_CHOICES,
    EMAIL_COMMUNICATION,
    PENDING_STATUS,
    STATUS_CHOICES,
)


class CommunicationTriggers(BaseModel):
    """Catalog of every event the system can send. `code` is the stable identifier
    callers pass in `data['trigger']`."""

    name        = models.CharField(max_length=250)
    code        = models.CharField(max_length=250, unique=True)
    template    = models.CharField(max_length=250, blank=True, default='')
    description = models.TextField(blank=True, default='')

    allow_email_communication        = models.BooleanField(default=True)
    allow_notification_communication = models.BooleanField(default=False)
    allow_whatsapp_communication     = models.BooleanField(default=False)

    default_allow_email_communication_value        = models.BooleanField(default=True)
    default_allow_notification_communication_value = models.BooleanField(default=True)
    default_allow_whatsapp_communication_value     = models.BooleanField(default=True)

    class Meta:
        db_table            = 'communication_triggers'
        verbose_name        = 'Communication Trigger'
        verbose_name_plural = 'Communication Triggers'

    def __str__(self):
        return self.code


class CommunicationPreferences(BaseModel):
    """Per-trigger opt-in toggles. `user=NULL` is the system-wide default row;
    `user=<id>` is that user's override on top of the default."""

    trigger = models.ForeignKey(
        CommunicationTriggers, on_delete=models.CASCADE, related_name='preferences'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='communication_preferences',
    )

    allow_email_communication        = models.BooleanField(default=True)
    allow_notification_communication = models.BooleanField(default=True)
    allow_whatsapp_communication     = models.BooleanField(default=True)

    class Meta:
        db_table = 'communication_preferences'
        constraints = [
            models.UniqueConstraint(
                fields=['trigger', 'user'], name='unique_communication_preference'
            ),
        ]
        verbose_name        = 'Communication Preference'
        verbose_name_plural = 'Communication Preferences'

    def __str__(self):
        return f"{self.trigger.code} / {self.user_id or 'system'}"


class CommunicationRequest(BaseModel):
    """Outbox + audit log + retry queue. One row per (trigger, channel) emission."""

    task_id            = models.UUIDField(default=uuid.uuid4)
    trigger            = models.ForeignKey(CommunicationTriggers, on_delete=models.PROTECT)
    communication_type = models.CharField(
        max_length=32, choices=CHANNEL_CHOICES, default=EMAIL_COMMUNICATION
    )
    status = models.SmallIntegerField(choices=STATUS_CHOICES, default=PENDING_STATUS)

    recipients = models.JSONField(default=list)
    data       = models.TextField(default='{}')

    next_attempt_time = models.DateTimeField(null=True, blank=True)
    result            = models.TextField(null=True, blank=True)
    traceback         = models.TextField(null=True, blank=True)
    retries           = models.IntegerField(default=0)
    retries_reasons   = models.JSONField(default=list)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='communication_requests',
    )
    user_group = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'communication_requests'
        ordering = ['-created_at']
        verbose_name        = 'Communication Request'
        verbose_name_plural = 'Communication Requests'
        indexes = [
            models.Index(fields=['status', 'next_attempt_time']),
            models.Index(fields=['communication_type', 'status']),
        ]

    def __str__(self):
        return f"{self.communication_type} #{self.task_id} ({self.get_status_display()})"
