from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from core.responses import APIResponse
from stores.models import StoreMember
from suppliers.models import Supplier
from suppliers.api.v1.serializers import (
    SupplierSerializer, CreateSupplierSerializer, UpdateSupplierSerializer,
)


class SupplierListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: SupplierSerializer(many=True)}, tags=["suppliers"])
    def get(self, request):
        store_id = request.query_params.get("store_id")
        if not store_id:
            return APIResponse.failed(data={"detail": "store_id query param is required."}, status_code=400)
        if not StoreMember.objects.filter(store_id=store_id, user=request.user).exists():
            return APIResponse.failed(data={"detail": "Not a member of this store."}, status_code=403)
        suppliers = Supplier.objects.filter(store_id=store_id, is_active=True)
        return APIResponse.success(data=SupplierSerializer(suppliers, many=True).data)

    @extend_schema(request=CreateSupplierSerializer, responses={201: SupplierSerializer}, tags=["suppliers"])
    def post(self, request):
        serializer = CreateSupplierSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        supplier = serializer.save()
        return APIResponse.success(data=SupplierSerializer(supplier).data, status_code=201)


class SupplierDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_supplier(self, pk):
        return get_object_or_404(Supplier, pk=pk, is_active=True)

    @extend_schema(request=UpdateSupplierSerializer, responses={200: SupplierSerializer}, tags=["suppliers"])
    def patch(self, request, pk):
        supplier = self._get_supplier(pk)
        if not StoreMember.objects.filter(store=supplier.store, user=request.user).exists():
            return APIResponse.failed(data={"detail": "Not a member of this store."}, status_code=403)
        serializer = UpdateSupplierSerializer(supplier, data=request.data, partial=True)
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        supplier = serializer.save()
        return APIResponse.success(data=SupplierSerializer(supplier).data)

    @extend_schema(tags=["suppliers"])
    def delete(self, request, pk):
        supplier = self._get_supplier(pk)
        if not StoreMember.objects.filter(store=supplier.store, user=request.user).exists():
            return APIResponse.failed(data={"detail": "Not a member of this store."}, status_code=403)
        supplier.is_active = False
        supplier.save(update_fields=["is_active"])
        return APIResponse.success(data=None, status_code=204)
