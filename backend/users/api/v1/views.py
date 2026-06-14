import logging

from decouple import config
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from drf_spectacular.utils import extend_schema

from core.responses import APIResponse
from users.api.v1.serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    LoginResponseSerializer,
    TokenRefreshResponseSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')


User = get_user_model()


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=GoogleAuthSerializer,
        summary="Sign in or register with Google",
        tags=["auth"],
    )
    def post(self, request):
        if not GOOGLE_CLIENT_ID:
            return APIResponse.failed(
                data={'detail': 'Google Sign-In is not configured.'}, status_code=503
            )

        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)

        id_token_str = serializer.validated_data['id_token']

        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            idinfo = id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                GOOGLE_CLIENT_ID,
            )
        except Exception as exc:
            logger.warning("Google ID token verification failed: %s", exc)
            return APIResponse.failed(data={'detail': 'Invalid Google token.'}, status_code=401)

        google_sub = idinfo['sub']
        email = idinfo.get('email', '')
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        email_verified = idinfo.get('email_verified', False)

        if not email_verified:
            return APIResponse.failed(
                data={'detail': 'Google email not verified.'}, status_code=400
            )

        user = None

        try:
            user = User.objects.get(google_id=google_sub)
        except User.DoesNotExist:
            pass

        if user is None and email:
            try:
                user = User.objects.get(email=email)
                fields_to_update = []
                if not user.google_id:
                    user.google_id = google_sub
                    fields_to_update.append('google_id')
                if not user.avatar_url and picture:
                    user.avatar_url = picture
                    fields_to_update.append('avatar_url')
                if fields_to_update:
                    user.save(update_fields=fields_to_update)
            except User.DoesNotExist:
                pass

        if user is None:
            name_parts = name.split(None, 1) if name else []
            first_name = name_parts[0] if name_parts else email.split('@')[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            user = User.objects.create_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=None,
                google_id=google_sub,
                avatar_url=picture or None,
            )
            user.set_unusable_password()
            user.save(update_fields=['password'])

        if not user.is_active:
            return APIResponse.failed(data={'detail': 'Account is disabled.'}, status_code=403)

        return APIResponse.success(data=_issue_tokens(user))


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: LoginResponseSerializer},
        summary="Login with email and password",
        tags=["auth"],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return APIResponse.success(
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }
        )


class TokenRefreshView(BaseTokenRefreshView):
    @extend_schema(
        responses={200: TokenRefreshResponseSerializer},
        summary="Refresh access token",
        tags=["auth"],
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        return APIResponse.success(data={"access": serializer.validated_data["access"]})


class MeView(APIView):
    @extend_schema(
        responses={200: UserSerializer},
        summary="Get current authenticated user",
        tags=["auth"],
    )
    def get(self, request):
        return APIResponse.success(data=UserSerializer(request.user).data)
