from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from retailflow.views import service_worker

urlpatterns = [
    path("sw.js", service_worker, name="service-worker"),
    path('admin/', include('retailflow.urls.admin')),
    path('api/', include('retailflow.urls.api')),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )

handler404 = 'retailflow.views.spa_view'
