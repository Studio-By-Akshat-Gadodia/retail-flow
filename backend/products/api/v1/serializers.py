from rest_framework import serializers

from products.models import Product
from stores.models import Store, StoreMember


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = (
            "id", "name", "sku", "category",
            "quantity", "unit_price", "reorder_level",
            "store", "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "store", "is_active", "created_at", "updated_at")


class CreateProductSerializer(serializers.ModelSerializer):
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(), write_only=True, source="store"
    )

    class Meta:
        model  = Product
        fields = ("store_id", "name", "sku", "category", "quantity", "unit_price", "reorder_level")

    def validate(self, attrs):
        store = attrs["store"]
        user  = self.context["request"].user
        if not StoreMember.objects.filter(store=store, user=user).exists():
            raise serializers.ValidationError({"store_id": "You are not a member of this store."})
        if Product.objects.filter(store=store, sku=attrs.get("sku"), is_active=True).exists():
            raise serializers.ValidationError({"sku": "A product with this SKU already exists in this store."})
        return attrs

    def create(self, validated_data):
        return Product.objects.create(created_by=self.context["request"].user, **validated_data)
