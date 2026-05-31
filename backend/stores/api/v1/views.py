from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.responses import APIResponse
from stores.models import Store, StoreMember, StoreRole, ROLE_LEVEL
from stores.permissions import IsStoreMember, IsStoreAdmin, IsStoreOwner
from stores.api.v1.serializers import (
    StoreSerializer,
    CreateStoreSerializer,
    StoreMemberSerializer,
    AddMemberSerializer,
    UpdateMemberRoleSerializer,
)


# ── Store endpoints ──────────────────────────────────────────

class StoreListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: StoreSerializer(many=True)}, tags=["stores"])
    def get(self, request):
        store_ids = StoreMember.objects.filter(user=request.user).values_list("store_id", flat=True)
        stores    = Store.objects.filter(id__in=store_ids, is_active=True)
        return APIResponse.success(data=StoreSerializer(stores, many=True, context={"request": request}).data)

    @extend_schema(request=CreateStoreSerializer, responses={201: StoreSerializer}, tags=["stores"])
    def post(self, request):
        serializer = CreateStoreSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        store = serializer.save()
        return APIResponse.success(
            data=StoreSerializer(store, context={"request": request}).data,
            status_code=201,
        )


class StoreDetailView(APIView):

    def _get_store(self, pk):
        return get_object_or_404(Store, pk=pk, is_active=True)

    @extend_schema(responses={200: StoreSerializer}, tags=["stores"])
    def get(self, request, pk):
        self.kwargs = {"pk": pk}
        IsStoreMember().has_permission(request, self) or self._deny()
        store = self._get_store(pk)
        return APIResponse.success(data=StoreSerializer(store, context={"request": request}).data)

    @extend_schema(request=CreateStoreSerializer, responses={200: StoreSerializer}, tags=["stores"])
    def patch(self, request, pk):
        self.kwargs = {"pk": pk}
        if not IsStoreAdmin().has_permission(request, self):
            return APIResponse.failed(data={"detail": IsStoreAdmin.message}, status_code=403)
        store      = self._get_store(pk)
        serializer = CreateStoreSerializer(store, data=request.data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        serializer.save()
        return APIResponse.success(data=StoreSerializer(store, context={"request": request}).data)

    @extend_schema(tags=["stores"])
    def delete(self, request, pk):
        self.kwargs = {"pk": pk}
        if not IsStoreOwner().has_permission(request, self):
            return APIResponse.failed(data={"detail": IsStoreOwner.message}, status_code=403)
        store = self._get_store(pk)
        store.is_active = False
        store.save(update_fields=["is_active"])
        return APIResponse.success(data=None, status_code=204)

    @staticmethod
    def _deny():
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied


# ── Member endpoints ─────────────────────────────────────────

class MemberListAddView(APIView):

    def _store(self, store_pk):
        return get_object_or_404(Store, pk=store_pk, is_active=True)

    @extend_schema(responses={200: StoreMemberSerializer(many=True)}, tags=["store-members"])
    def get(self, request, store_pk):
        self.kwargs = {"store_pk": store_pk}
        if not IsStoreMember().has_permission(request, self):
            return APIResponse.failed(data={"detail": "Not a member."}, status_code=403)
        members = StoreMember.objects.filter(store_id=store_pk).select_related("user", "invited_by")
        return APIResponse.success(data=StoreMemberSerializer(members, many=True).data)

    @extend_schema(request=AddMemberSerializer, responses={201: StoreMemberSerializer}, tags=["store-members"])
    def post(self, request, store_pk):
        self.kwargs = {"store_pk": store_pk}
        if not IsStoreAdmin().has_permission(request, self):
            return APIResponse.failed(data={"detail": IsStoreAdmin.message}, status_code=403)
        store      = self._store(store_pk)
        serializer = AddMemberSerializer(data=request.data, context={"store": store, "request": request})
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        member = StoreMember.objects.create(
            store=store,
            user=serializer.validated_data["user"],
            role=serializer.validated_data["role"],
            invited_by=request.user,
        )
        return APIResponse.success(data=StoreMemberSerializer(member).data, status_code=201)


class MemberDetailView(APIView):

    def _member(self, store_pk, user_pk):
        return get_object_or_404(StoreMember, store_id=store_pk, user_id=user_pk)

    @extend_schema(request=UpdateMemberRoleSerializer, responses={200: StoreMemberSerializer}, tags=["store-members"])
    def patch(self, request, store_pk, user_pk):
        self.kwargs = {"store_pk": store_pk}
        if not IsStoreAdmin().has_permission(request, self):
            return APIResponse.failed(data={"detail": IsStoreAdmin.message}, status_code=403)

        member = self._member(store_pk, user_pk)

        if member.role == StoreRole.OWNER:
            return APIResponse.failed(data={"detail": "Cannot change the owner's role."}, status_code=400)

        # Prevent privilege escalation: caller must outrank the target's new role
        caller_level = ROLE_LEVEL.get(
            StoreMember.objects.get(store_id=store_pk, user=request.user).role, -1
        )
        serializer = UpdateMemberRoleSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)

        new_level = ROLE_LEVEL.get(serializer.validated_data["role"], -1)
        if new_level >= caller_level:
            return APIResponse.failed(
                data={"detail": "You cannot assign a role equal to or above your own."},
                status_code=403,
            )

        member.role = serializer.validated_data["role"]
        member.save(update_fields=["role"])
        return APIResponse.success(data=StoreMemberSerializer(member).data)

    @extend_schema(tags=["store-members"])
    def delete(self, request, store_pk, user_pk):
        self.kwargs = {"store_pk": store_pk}
        member = self._member(store_pk, user_pk)

        # Owner cannot be removed
        if member.role == StoreRole.OWNER:
            return APIResponse.failed(data={"detail": "The owner cannot be removed."}, status_code=400)

        # Allow self-removal OR admin+
        is_self = str(request.user.pk) == str(user_pk)
        if not is_self and not IsStoreAdmin().has_permission(request, self):
            return APIResponse.failed(data={"detail": IsStoreAdmin.message}, status_code=403)

        member.delete()
        return APIResponse.success(data=None, status_code=204)
