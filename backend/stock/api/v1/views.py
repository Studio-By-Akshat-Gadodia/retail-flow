from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from core.responses import APIResponse
from stock.services import record_stock_in
from stock.api.v1.serializers import StockInSerializer, StockMovementSerializer


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
