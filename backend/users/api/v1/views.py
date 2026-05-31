from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from drf_spectacular.utils import extend_schema

from core.responses import APIResponse
from users.api.v1.serializers import (
    LoginSerializer,
    LoginResponseSerializer,
    TokenRefreshResponseSerializer,
    UserSerializer,
)


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
