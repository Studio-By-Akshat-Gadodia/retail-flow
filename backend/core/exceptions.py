from rest_framework.views import exception_handler
from core.responses import APIResponse


def global_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        return APIResponse.failed(data=response.data, status_code=response.status_code)

    return APIResponse.failed(
        data={"detail": "An unexpected error occurred."},
        status_code=500,
    )
