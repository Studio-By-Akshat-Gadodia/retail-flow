from django.urls import path, include
from retailflow.views import service_worker

urlpatterns = [
    path("sw.js", service_worker, name="service-worker"),
    path("", include("retailflow.urls.admin")),
    path("", include("retailflow.urls.api")),
]

handler404 = "retailflow.views.spa_view"
