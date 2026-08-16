from django.urls import path
from dashboard.api.v1.views import DashboardSummaryView

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
]
