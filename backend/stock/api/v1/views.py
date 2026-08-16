from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from core.responses import APIResponse
from core.pagination import paginate_or_full
from stores.models import StoreMember
from stock.models import StockMovement
from stock.services import record_stock_in, record_stock_out, InsufficientStockError
from stock.api.v1.serializers import (
    StockInSerializer, StockOutSerializer,
    StockMovementSerializer, StockTransactionSerializer,
)


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


class StockTransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: StockTransactionSerializer(many=True)}, tags=["stock"])
    def get(self, request):
        store_id = request.query_params.get("store_id")
        if not store_id:
            return APIResponse.failed(data={"detail": "store_id query param is required."}, status_code=400)
        if not StoreMember.objects.filter(store_id=store_id, user=request.user).exists():
            return APIResponse.failed(data={"detail": "Not a member of this store."}, status_code=403)

        qs = (
            StockMovement.objects
            .filter(product__store_id=store_id)
            .select_related("product", "performed_by")
        )

        product_id = request.query_params.get("product_id")
        if product_id:
            qs = qs.filter(product_id=product_id)

        movement_type = request.query_params.get("movement_type")
        if movement_type in (StockMovement.STOCK_IN, StockMovement.STOCK_OUT):
            qs = qs.filter(movement_type=movement_type)

        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return paginate_or_full(qs, request, self, StockTransactionSerializer)
