from django.urls import path
from stock.api.v1.views import StockInView

urlpatterns = [
    path("in/", StockInView.as_view(), name="stock-in"),
]
