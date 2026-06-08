REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "core.exceptions.global_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPaginator",
    "PAGE_SIZE": 10,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon":           "200/hour",
        "user":           "2000/hour",
        "login":          "10/minute",
        "register":       "20/hour",
        "password_reset": "5/hour",
        "token_refresh":  "30/minute",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}
