"""Management command: send a test push notification.

Usage:
    python manage.py send_test_push --token <fcm_token>
"""

from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Send a test push notification to verify Firebase FCM is configured correctly.'

    def add_arguments(self, parser):
        parser.add_argument('--token', required=True, help='Raw FCM device token')

    def handle(self, *args, **options):
        from communication.services.push_notification import PushNotification

        tokens = [options['token']]
        self.stdout.write(f'Sending test push to token: {tokens[0][:20]}…')

        try:
            result = PushNotification().send(
                registration_ids=tokens,
                title='RetailFlow — push test',
                body='If you see this, FCM push notifications are working correctly.',
                data={'test': 'true'},
            )
            self.stdout.write(self.style.SUCCESS(f'Push sent successfully. Result: {result}'))
        except Exception as exc:
            raise CommandError(f'Push send failed: {exc}') from exc
