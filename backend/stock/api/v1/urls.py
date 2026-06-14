from django.urls import path
from stock.api.v1.views import StockInView, StockOutView

urlpatterns = [
    path("in/",  StockInView.as_view(),  name="stock-in"),
    path("out/", StockOutView.as_view(), name="stock-out"),
]
