from django.contrib import admin
from django.contrib import messages
from django.shortcuts import redirect
from django.urls import path

from core.admin import BaseModelAdmin

from .models import CommunicationPreferences, CommunicationRequest, CommunicationTriggers
from .tasks import process_communication_request


@admin.register(CommunicationTriggers)
class CommunicationTriggersAdmin(BaseModelAdmin):
    list_display = (
        'code', 'name',
        'allow_email_communication',
        'allow_notification_communication',
        'allow_whatsapp_communication',
    )
    search_fields = ('code', 'name')
    list_filter   = (
        'allow_email_communication',
        'allow_notification_communication',
        'allow_whatsapp_communication',
    )


@admin.register(CommunicationPreferences)
class CommunicationPreferencesAdmin(BaseModelAdmin):
    list_display = (
        'trigger', 'user',
        'allow_email_communication',
        'allow_notification_communication',
        'allow_whatsapp_communication',
    )
    list_filter          = ('trigger',)
    autocomplete_fields  = ('trigger', 'user')
    search_fields        = ('trigger__code', 'user__email')


@admin.register(CommunicationRequest)
class CommunicationRequestAdmin(BaseModelAdmin):
    list_display  = ('task_id', 'communication_type', 'trigger', 'status', 'retries', 'created_at')
    list_filter   = ('communication_type', 'status', 'trigger')
    readonly_fields = BaseModelAdmin.readonly_fields + (
        'task_id', 'trigger', 'communication_type', 'recipients', 'data',
        'result', 'traceback', 'retries', 'retries_reasons', 'next_attempt_time',
    )
    search_fields = ('task_id', 'trigger__code', 'user__email')
    actions = ['retry_selected']

    def get_urls(self):
        return [
            path(
                'retry/<uuid:request_id>/',
                self.admin_site.admin_view(self.retry_one),
                name='retry_communication_request',
            ),
        ] + super().get_urls()

    def retry_one(self, request, request_id):
        process_communication_request.delay(str(request_id))
        messages.success(request, f"Retry queued for {request_id}.")
        return redirect('admin:communication_communicationrequest_changelist')

    @admin.action(description="Retry selected communication requests")
    def retry_selected(self, request, queryset):
        for req in queryset:
            process_communication_request.delay(str(req.id))
        self.message_user(request, f"Retry queued for {queryset.count()} request(s).")
