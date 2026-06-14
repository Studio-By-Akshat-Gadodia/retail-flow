"""FCM push notification client via firebase-admin (optional dependency)."""

import logging
from typing import Iterable

from decouple import config

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials, messaging as fcm_messaging
    HAS_FIREBASE = True
except ImportError:
    firebase_admin = None   # type: ignore
    credentials   = None    # type: ignore
    fcm_messaging = None    # type: ignore
    HAS_FIREBASE  = False


class PushNotification:
    _app = None

    def __init__(self):
        if not HAS_FIREBASE:
            raise RuntimeError(
                "firebase-admin is not installed — push notifications are disabled."
            )
        if PushNotification._app is None:
            PushNotification._app = self._build_app()

    @staticmethod
    def _build_app():
        project_id   = config('FIREBASE_PROJECT_ID',   default='')
        client_email = config('FIREBASE_CLIENT_EMAIL', default='')
        private_key  = config('FIREBASE_PRIVATE_KEY',  default='').replace('\\n', '\n')
        token_uri    = config('FIREBASE_TOKEN_URI',    default='https://oauth2.googleapis.com/token')
        if not (project_id and client_email and private_key):
            raise RuntimeError("Firebase env vars are not set — push disabled.")
        cred = credentials.Certificate({
            'type': 'service_account',
            'project_id': project_id,
            'private_key': private_key,
            'client_email': client_email,
            'token_uri': token_uri,
        })
        return firebase_admin.initialize_app(cred)

    def send(
        self,
        registration_ids: Iterable[str],
        title: str,
        body: str,
        data: dict | None = None,
    ) -> dict:
        tokens       = list(registration_ids)
        message_ids  = []
        invalid_tokens = []
        for token in tokens:
            msg = fcm_messaging.Message(
                notification=fcm_messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in (data or {}).items()},
                token=token,
            )
            try:
                message_ids.append(fcm_messaging.send(msg))
            except Exception as exc:
                code = getattr(exc, 'code', None) or ''
                if (
                    'registration-token-not-registered' in str(code)
                    or 'invalid-registration-token' in str(code)
                ):
                    invalid_tokens.append(token)
                    logger.info('FCM: stale token removed — %s', token[:20])
                else:
                    raise

        return {
            'sent_to': tokens,
            'message_ids': message_ids,
            'invalid_tokens': invalid_tokens,
        }
