"""Celery application for RetailFlow.

Quick-start (run from backend/ with the venv active):

    celery -A retailflow worker -l info

Redis must be running: redis-server  (default port 6379)
CELERY_BROKER_URL must be set in .env (default: redis://localhost:6379/0)
"""

import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retailflow.settings')

app = Celery('retailflow')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()
