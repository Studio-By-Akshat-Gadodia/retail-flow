from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from core.responses import APIResponse
from stock.services import record_stock_in, record_stock_out, InsufficientStockError
from stock.api.v1.serializers import StockInSerializer, StockOutSerializer, StockMovementSerializer


class StockInView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=StockInSerializer, responses={201: StockMovementSerializer}, tags=["stock"])
    def post(self, request):
        serializer = StockInSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        movement = record_stock_in(
            product_id=serializer.validated_data["product_id"].pk,
            quantity=serializer.validated_data["quantity"],
            user=request.user,
            notes=serializer.validated_data["notes"],
        )
        return APIResponse.success(data=StockMovementSerializer(movement).data, status_code=201)


class StockOutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=StockOutSerializer, responses={201: StockMovementSerializer}, tags=["stock"])
    def post(self, request):
        serializer = StockOutSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        try:
            movement = record_stock_out(
                product_id=serializer.validated_data["product_id"].pk,
                quantity=serializer.validated_data["quantity"],
                user=request.user,
                notes=serializer.validated_data["notes"],
            )
        except InsufficientStockError as exc:
            return APIResponse.failed(data={"quantity": [str(exc)]})
        return APIResponse.success(data=StockMovementSerializer(movement).data, status_code=201)
