from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from core.responses import APIResponse
from stores.models import StoreMember
from products.models import Product
from products.api.v1.serializers import ProductSerializer, CreateProductSerializer, UpdateProductSerializer


class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ProductSerializer(many=True)}, tags=["products"])
    def get(self, request):
        store_id = request.query_params.get("store_id")
        if not store_id:
            return APIResponse.failed(data={"detail": "store_id query param is required."}, status_code=400)
        if not StoreMember.objects.filter(store_id=store_id, user=request.user).exists():
            return APIResponse.failed(data={"detail": "Not a member of this store."}, status_code=403)
        products = Product.objects.filter(store_id=store_id, is_active=True)
        if request.query_params.get("low_stock") == "true":
            from django.db.models import F
            products = products.filter(quantity__lte=F("reorder_level"))
        return APIResponse.success(data=ProductSerializer(products, many=True).data)

    @extend_schema(request=CreateProductSerializer, responses={201: ProductSerializer}, tags=["products"])
    def post(self, request):
        serializer = CreateProductSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        product = serializer.save()
        return APIResponse.success(data=ProductSerializer(product).data, status_code=201)


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_product(self, pk):
        return get_object_or_404(Product, pk=pk, is_active=True)

    @extend_schema(request=UpdateProductSerializer, responses={200: ProductSerializer}, tags=["products"])
    def patch(self, request, pk):
        product = self._get_product(pk)
        if not StoreMember.objects.filter(store=product.store, user=request.user).exists():
            return APIResponse.failed(data={"detail": "Not a member of this store."}, status_code=403)
        serializer = UpdateProductSerializer(
            product, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return APIResponse.failed(data=serializer.errors)
        product = serializer.save()
        return APIResponse.success(data=ProductSerializer(product).data)

    @extend_schema(tags=["products"])
    def delete(self, request, pk):
        product = self._get_product(pk)
        if not StoreMember.objects.filter(store=product.store, user=request.user).exists():
            return APIResponse.failed(data={"detail": "Not a member of this store."}, status_code=403)
        product.is_active = False
        product.save(update_fields=["is_active"])
        return APIResponse.success(data=None, status_code=204)
