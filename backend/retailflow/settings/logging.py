from pathlib import Path

from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOG_DIR  = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

LOG_LEVEL        = config('LOG_LEVEL',        default='INFO').upper()
DJANGO_LOG_LEVEL = config('DJANGO_LOG_LEVEL', default='INFO').upper()
DB_LOG_LEVEL     = config('DB_LOG_LEVEL',     default='WARNING').upper()

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {module}:{lineno} — {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{levelname}] {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class':     'logging.StreamHandler',
            'formatter': 'simple',
            'level':     LOG_LEVEL,
        },
        'file': {
            'class':       'logging.handlers.RotatingFileHandler',
            'filename':    str(LOG_DIR / 'app.log'),
            'maxBytes':    5 * 1024 * 1024,
            'backupCount': 5,
            'formatter':   'verbose',
            'level':       LOG_LEVEL,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level':    LOG_LEVEL,
    },
    'loggers': {
        'django': {
            'handlers':  ['console', 'file'],
            'level':     DJANGO_LOG_LEVEL,
            'propagate': False,
        },
        'django.db.backends': {
            'handlers':  ['console'],
            'level':     DB_LOG_LEVEL,
            'propagate': False,
        },
        'django.request': {
            'handlers':  ['console', 'file'],
            'level':     'WARNING',
            'propagate': False,
        },
    },
}
