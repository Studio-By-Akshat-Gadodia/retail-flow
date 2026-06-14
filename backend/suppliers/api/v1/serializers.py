from rest_framework import serializers

from stores.models import Store, StoreMember
from suppliers.models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = (
            "id", "store", "name", "contact_name",
            "email", "phone", "notes",
            "is_active", "created_at", "updated_at",
        )
        read_only_fields = fields


class CreateSupplierSerializer(serializers.ModelSerializer):
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(), write_only=True, source="store"
    )

    class Meta:
        model      = Supplier
        fields     = ("store_id", "name", "contact_name", "email", "phone", "notes")
        validators = []  # unique_together checked manually with is_active filter

    def validate(self, attrs):
        store = attrs["store"]
        user  = self.context["request"].user
        if not StoreMember.objects.filter(store=store, user=user).exists():
            raise serializers.ValidationError({"store_id": "You are not a member of this store."})
        if Supplier.objects.filter(store=store, name=attrs.get("name"), is_active=True).exists():
            raise serializers.ValidationError({"name": "A supplier with this name already exists in this store."})
        return attrs

    def create(self, validated_data):
        return Supplier.objects.create(created_by=self.context["request"].user, **validated_data)


class UpdateSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = ("name", "contact_name", "email", "phone", "notes")

    def validate_name(self, value):
        qs = Supplier.objects.filter(store=self.instance.store, name=value, is_active=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A supplier with this name already exists in this store.")
        return value
