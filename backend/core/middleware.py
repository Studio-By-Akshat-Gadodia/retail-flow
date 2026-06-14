"""Thread-local storage for the current HTTP request.

Stores the request object so signal handlers (which have no access to
the view's request) can retrieve the authenticated user.
"""

import threading

_thread_local = threading.local()


def get_current_request():
    return getattr(_thread_local, 'request', None)


def get_current_user():
    req = get_current_request()
    if req is None:
        return None
    user = getattr(req, 'user', None)
    if user is None or not getattr(user, 'is_authenticated', False):
        return None
    return user


class CurrentRequestMiddleware:
    """Store the current request in thread-local so signals can access
    ``request.user`` without being passed the request explicitly."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_local.request = request
        try:
            return self.get_response(request)
        finally:
            _thread_local.request = None
