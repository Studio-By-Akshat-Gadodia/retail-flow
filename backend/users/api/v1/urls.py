from django.urls import path
from users.api.v1.views import GoogleAuthView, LoginView, TokenRefreshView, MeView

urlpatterns = [
    path("login/", LoginView.as_view(), name="user-login"),
    path("google/", GoogleAuthView.as_view(), name="user-google-auth"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="user-me"),
]
