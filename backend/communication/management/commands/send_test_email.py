"""Management command: send a test email to verify SMTP is configured correctly.

Usage:
    python manage.py send_test_email <recipient>
"""

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Send a test email to verify SMTP configuration.'

    def add_arguments(self, parser):
        parser.add_argument('recipient', help='Email address to send the test to')

    def handle(self, *args, **options):
        recipient = options['recipient']
        self.stdout.write(f'Sending test email to {recipient} …')
        self.stdout.write(f'  Backend : {settings.EMAIL_BACKEND}')
        self.stdout.write(f'  Host    : {getattr(settings, "EMAIL_HOST", "—")}:{getattr(settings, "EMAIL_PORT", "—")}')
        self.stdout.write(f'  From    : {settings.DEFAULT_FROM_EMAIL}')

        try:
            sent = send_mail(
                subject='RetailFlow — email test',
                message='This is a test email from RetailFlow. If you received this, SMTP is working correctly.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
        except Exception as exc:
            raise CommandError(f'Email send failed: {exc}') from exc

        if sent:
            self.stdout.write(self.style.SUCCESS(f'Test email sent successfully to {recipient}.'))
        else:
            raise CommandError('send_mail returned 0 — email was not sent. Check EMAIL_HOST_PASSWORD.')
