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
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}
