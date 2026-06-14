from rest_framework import serializers

from products.models import Product
from stores.models import StoreMember
from stock.models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StockMovement
        fields = ("id", "product", "movement_type", "quantity", "notes", "performed_by", "created_at")
        read_only_fields = fields


class _BaseStockSerializer(serializers.Serializer):
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


class StockInSerializer(_BaseStockSerializer):
    pass


class StockOutSerializer(_BaseStockSerializer):
    def validate(self, attrs):
        product  = attrs["product_id"]
        quantity = attrs["quantity"]
        if product.quantity < quantity:
            raise serializers.ValidationError(
                {"quantity": f"Only {product.quantity} unit(s) available."}
            )
        return attrs


class StockTransactionSerializer(serializers.ModelSerializer):
    product_name      = serializers.CharField(source="product.name", read_only=True)
    product_sku       = serializers.CharField(source="product.sku",  read_only=True)
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = StockMovement
        fields = (
            "id", "product", "product_name", "product_sku",
            "movement_type", "quantity", "notes",
            "performed_by", "performed_by_name", "created_at",
        )
        read_only_fields = fields

    def get_performed_by_name(self, obj):
        if not obj.performed_by:
            return None
        name = f"{obj.performed_by.first_name} {obj.performed_by.last_name}".strip()
        return name or obj.performed_by.email
