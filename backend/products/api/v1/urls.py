from django.urls import path
from products.api.v1.views import ProductListCreateView

urlpatterns = [
    path("", ProductListCreateView.as_view(), name="product-list-create"),
]
