from django.urls import path

from .views import CartClearView, CartItemCreateView, CartItemUpdateDeleteView, CartView

urlpatterns = [
    path("", CartView.as_view(), name="cart-detail"),
    path("items/", CartItemCreateView.as_view(), name="cart-item-create"),
    path("items/<int:pk>/", CartItemUpdateDeleteView.as_view(), name="cart-item-update-delete"),
    path("clear/", CartClearView.as_view(), name="cart-clear"),
]
