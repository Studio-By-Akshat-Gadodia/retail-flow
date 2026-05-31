from django.urls import path
from stores.api.v1.views import (
    StoreListCreateView,
    StoreDetailView,
    MemberListAddView,
    MemberDetailView,
)

urlpatterns = [
    # Stores
    path("",                              StoreListCreateView.as_view(), name="store-list-create"),
    path("<int:pk>/",                     StoreDetailView.as_view(),     name="store-detail"),
    # Members
    path("<int:store_pk>/members/",           MemberListAddView.as_view(), name="store-member-list-add"),
    path("<int:store_pk>/members/<int:user_pk>/", MemberDetailView.as_view(), name="store-member-detail"),
]
