from django.urls import path
from users.api.v1.views import LoginView, TokenRefreshView, MeView

urlpatterns = [
    path("login/", LoginView.as_view(), name="user-login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="user-me"),
]
