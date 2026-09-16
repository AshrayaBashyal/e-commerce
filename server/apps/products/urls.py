from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListCreateView,
    ProductDetailView,
    ProductImageDeleteView,
    ProductImageUploadView,
    ProductListCreateView,
    ProductRecommendationsView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    path("products/", ProductListCreateView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("products/<int:pk>/images/", ProductImageUploadView.as_view(), name="product-image-upload"),
    path("products/<int:pk>/images/<int:image_id>/", ProductImageDeleteView.as_view(), name="product-image-delete"),
    path("products/<int:pk>/recommendations/", ProductRecommendationsView.as_view(), name="product-recommendations"),
]
