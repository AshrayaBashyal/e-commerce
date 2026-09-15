from django.urls import path

from .admin_views import UserDetailView, UserListView, UserRoleUpdateView

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("<int:pk>/role/", UserRoleUpdateView.as_view(), name="user-role-update"),
]