from rest_framework import serializers

from products.models import Product
from stores.models import StoreMember
from stock.models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StockMovement
        fields = ("id", "product", "movement_type", "quantity", "notes", "performed_by", "created_at")
        read_only_fields = fields


class StockInSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True)
    )
    quantity   = serializers.IntegerField(min_value=1)
    notes      = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")

    def validate_product_id(self, product):
        user = self.context["request"].user
        if not StoreMember.objects.filter(store=product.store, user=user).exists():
            raise serializers.ValidationError("You are not a member of this store.")
        return product
