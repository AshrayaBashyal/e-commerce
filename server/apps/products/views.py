from django.db import models
from django.db.models.functions import Abs
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.common.permissions import IsAdmin, ReadOnlyOrAdmin
from .filters import ProductFilter
from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer,
    ProductImageSerializer,
    ProductSerializer,
    ProductWriteSerializer,
)


class CategoryListCreateView(generics.ListCreateAPIView):
    """List active categories, or create one as admin."""

    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Category.objects.all()
        return Category.objects.filter(is_active=True)


class CategoryDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve a category, or update it as admin."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAdmin]


class ProductListCreateView(generics.ListCreateAPIView):
    """List active products with search and filters, or create one as admin."""

    filterset_class = ProductFilter
    search_fields = ["name", "description"]
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        qs = Product.objects.select_related("category").prefetch_related("images")
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return qs
        return qs.filter(is_active=True)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductWriteSerializer
        return ProductSerializer

    def create(self, request, *args, **kwargs):
        serializer = ProductWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        output = ProductSerializer(serializer.instance, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve a product, or update/delete it as admin."""

    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        qs = Product.objects.select_related("category").prefetch_related("images")
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return qs
        return qs.filter(is_active=True)

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return ProductWriteSerializer
        return ProductSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ProductWriteSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        output = ProductSerializer(serializer.instance, context={"request": request})
        return Response(output.data)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()

        try:
            from apps.orders.models import OrderItem
            has_order_history = OrderItem.objects.filter(product=product).exists()
        except ImportError:
            has_order_history = False

        if has_order_history:
            return Response(
                {"error": "This product has order history. Deactivate it instead of deleting."},
                status=status.HTTP_409_CONFLICT,
            )

        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageUploadView(generics.CreateAPIView):
    """Add an image to a product. Admin only."""

    serializer_class = ProductImageSerializer
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        product = get_object_or_404(Product, pk=self.kwargs["pk"])
        serializer.save(product=product)


class ProductImageDeleteView(generics.DestroyAPIView):
    """Remove an image from a product. Admin only."""

    serializer_class = ProductImageSerializer
    permission_classes = [IsAdmin]

    def get_object(self):
        return get_object_or_404(
            ProductImage, pk=self.kwargs["image_id"], product_id=self.kwargs["pk"]
        )


class ProductRecommendationsView(generics.ListAPIView):
    """Content-based recommendations: same category, closest price, active only."""

    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Product.objects.none()
        product = get_object_or_404(Product, pk=self.kwargs["pk"], is_active=True)
        return (
            Product.objects.filter(category=product.category, is_active=True)
            .exclude(pk=product.pk)
            .annotate(price_diff=Abs(models.F("price") - product.price))
            .order_by("price_diff")[:5]
        )
