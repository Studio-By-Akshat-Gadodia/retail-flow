from decimal import Decimal

from django.db.models import F, Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from core.responses import APIResponse
from stores.models import StoreMember
from products.models import Product
from stock.models import StockMovement
from dashboard.api.v1.serializers import DashboardSummarySerializer

RECENT_ACTIVITY_LIMIT = 10


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: DashboardSummarySerializer}, tags=["dashboard"])
    def get(self, request):
        store_id = request.query_params.get("store_id")
        if not store_id:
            return APIResponse.failed(data={"detail": "store_id query param is required."}, status_code=400)
        if not StoreMember.objects.filter(store_id=store_id, user=request.user).exists():
            return APIResponse.failed(data={"detail": "Not a member of this store."}, status_code=403)

        products = Product.objects.filter(store_id=store_id, is_active=True)
        total_value = products.aggregate(
            total=Sum(F("quantity") * F("unit_price"))
        )["total"] or Decimal("0")

        recent_activity = (
            StockMovement.objects
            .filter(product__store_id=store_id)
            .select_related("product")
            .order_by("-created_at")[:RECENT_ACTIVITY_LIMIT]
        )

        data = {
            "total_products":        products.count(),
            "total_inventory_value": total_value,
            "low_stock_count":       products.filter(quantity__lte=F("reorder_level")).count(),
            "out_of_stock_count":    products.filter(quantity=0).count(),
            "recent_activity":       recent_activity,
        }
        serializer = DashboardSummarySerializer(data)
        return APIResponse.success(data=serializer.data)
