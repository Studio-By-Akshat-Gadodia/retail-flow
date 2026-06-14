from decouple import config

EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST         = config('EMAIL_HOST',          default='smtp.gmail.com')
EMAIL_PORT         = config('EMAIL_PORT',          default=587, cast=int)
EMAIL_HOST_USER    = config('EMAIL_HOST_USER',     default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS      = config('EMAIL_USE_TLS',       default=True,  cast=bool)
EMAIL_USE_SSL      = config('EMAIL_USE_SSL',       default=False, cast=bool)
EMAIL_TIMEOUT      = config('EMAIL_TIMEOUT',       default=30,    cast=int)
DEFAULT_FROM_EMAIL = config(
    'DEFAULT_FROM_EMAIL',
    default='RetailFlow <noreply@example.com>',
)
SERVER_EMAIL = config('SERVER_EMAIL', default=EMAIL_HOST_USER)

ADMINS = [
    (
        config('ADMIN_NAME',  default='Admin'),
        config('ADMIN_EMAIL', default='admin@example.com'),
    )
]
MANAGERS = ADMINS
