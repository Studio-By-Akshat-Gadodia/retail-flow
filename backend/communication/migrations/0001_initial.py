import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CommunicationTriggers',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=250)),
                ('code', models.CharField(max_length=250, unique=True)),
                ('template', models.CharField(blank=True, default='', max_length=250)),
                ('description', models.TextField(blank=True, default='')),
                ('allow_email_communication', models.BooleanField(default=True)),
                ('allow_notification_communication', models.BooleanField(default=False)),
                ('allow_whatsapp_communication', models.BooleanField(default=False)),
                ('default_allow_email_communication_value', models.BooleanField(default=True)),
                ('default_allow_notification_communication_value', models.BooleanField(default=True)),
                ('default_allow_whatsapp_communication_value', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Communication Trigger',
                'verbose_name_plural': 'Communication Triggers',
                'db_table': 'communication_triggers',
            },
        ),
        migrations.CreateModel(
            name='CommunicationPreferences',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('allow_email_communication', models.BooleanField(default=True)),
                ('allow_notification_communication', models.BooleanField(default=True)),
                ('allow_whatsapp_communication', models.BooleanField(default=True)),
                ('trigger', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='preferences',
                    to='communication.communicationtriggers',
                )),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='communication_preferences',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Communication Preference',
                'verbose_name_plural': 'Communication Preferences',
                'db_table': 'communication_preferences',
            },
        ),
        migrations.AddConstraint(
            model_name='communicationpreferences',
            constraint=models.UniqueConstraint(
                fields=['trigger', 'user'], name='unique_communication_preference'
            ),
        ),
        migrations.CreateModel(
            name='CommunicationRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('task_id', models.UUIDField(default=uuid.uuid4)),
                ('communication_type', models.CharField(
                    choices=[('EMAIL', 'Email'), ('WHATSAPP', 'WhatsApp'), ('PUSH_NOTIFICATION', 'Push Notification')],
                    default='EMAIL',
                    max_length=32,
                )),
                ('status', models.SmallIntegerField(
                    choices=[(0, 'Pending'), (1, 'Started'), (2, 'Success'), (3, 'Retry'), (4, 'Failure')],
                    default=0,
                )),
                ('recipients', models.JSONField(default=list)),
                ('data', models.TextField(default='{}')),
                ('next_attempt_time', models.DateTimeField(blank=True, null=True)),
                ('result', models.TextField(blank=True, null=True)),
                ('traceback', models.TextField(blank=True, null=True)),
                ('retries', models.IntegerField(default=0)),
                ('retries_reasons', models.JSONField(default=list)),
                ('user_group', models.CharField(blank=True, max_length=255, null=True)),
                ('trigger', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    to='communication.communicationtriggers',
                )),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='communication_requests',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Communication Request',
                'verbose_name_plural': 'Communication Requests',
                'db_table': 'communication_requests',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='communicationrequest',
            index=models.Index(fields=['status', 'next_attempt_time'], name='comm_req_status_next_idx'),
        ),
        migrations.AddIndex(
            model_name='communicationrequest',
            index=models.Index(fields=['communication_type', 'status'], name='comm_req_type_status_idx'),
        ),
    ]
