from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("v1/users/",    include("users.api.v1.urls")),
    path("v1/stores/",   include("stores.api.v1.urls")),
    path("v1/products/", include("products.api.v1.urls")),
    path("v1/stock/",    include("stock.api.v1.urls")),
    path("v1/dashboard/", include("dashboard.api.v1.urls")),
    # Swagger
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
