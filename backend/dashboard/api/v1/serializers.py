from rest_framework import serializers

from stock.models import StockMovement


class RecentActivitySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku  = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model  = StockMovement
        fields = (
            "id", "product", "product_name", "product_sku",
            "movement_type", "quantity", "notes", "created_at",
        )
        read_only_fields = fields


class DashboardSummarySerializer(serializers.Serializer):
    total_products        = serializers.IntegerField()
    total_inventory_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    low_stock_count       = serializers.IntegerField()
    out_of_stock_count    = serializers.IntegerField()
    recent_activity       = RecentActivitySerializer(many=True)
