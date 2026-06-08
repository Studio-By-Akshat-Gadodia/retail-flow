from django.db import transaction
from rest_framework import serializers

from stores.models import Store, StoreMember, StoreRole, ROLE_LEVEL
from users.api.v1.serializers import UserSerializer


class StoreMemberSerializer(serializers.ModelSerializer):
    user       = UserSerializer(read_only=True)
    invited_by = UserSerializer(read_only=True)

    class Meta:
        model  = StoreMember
        fields = ("id", "user", "role", "invited_by", "joined_at")
        read_only_fields = ("id", "user", "invited_by", "joined_at")


class AddMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role  = serializers.ChoiceField(
        choices=[c for c in StoreRole.choices if c[0] != StoreRole.OWNER]
    )

    def validate_email(self, value):
        from users.models import User
        try:
            return User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email.")

    def validate(self, attrs):
        user  = attrs["email"]  # already resolved to User object
        store = self.context["store"]
        if StoreMember.objects.filter(store=store, user=user).exists():
            raise serializers.ValidationError(
                {"email": "This user is already a member of the store."}
            )
        attrs["user"] = user
        return attrs


class UpdateMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=[c for c in StoreRole.choices if c[0] != StoreRole.OWNER]
    )


class StoreSerializer(serializers.ModelSerializer):
    my_role      = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    created_by   = UserSerializer(read_only=True)

    class Meta:
        model  = Store
        fields = (
            "id", "name", "slug", "description",
            "currency", "timezone", "is_active",
            "my_role", "member_count",
            "created_by", "created_at", "updated_at",
        )
        read_only_fields = ("id", "slug", "created_by", "created_at", "updated_at")

    def get_my_role(self, obj) -> str | None:
        user = self.context["request"].user
        try:
            return StoreMember.objects.get(store=obj, user=user).role
        except StoreMember.DoesNotExist:
            return None

    def get_member_count(self, obj) -> int:
        return obj.members.count()


class CreateStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Store
        fields = ("name", "description", "currency", "timezone")

    def validate_name(self, value):
        user = self.context["request"].user
        qs = Store.objects.filter(name__iexact=value, created_by=user)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("You already have a store with this name.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user  = self.context["request"].user
        store = Store.objects.create(created_by=user, **validated_data)
        StoreMember.objects.create(store=store, user=user, role=StoreRole.OWNER)
        return store
