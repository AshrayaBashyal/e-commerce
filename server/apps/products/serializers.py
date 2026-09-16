from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CategoryMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "display_order"]
        read_only_fields = ["id"]


class ProductSerializer(serializers.ModelSerializer):
    """Read serializer, used for list and detail responses."""

    category = CategoryMiniSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "description", "price", "inventory_quantity",
            "is_active", "category", "images", "created_at", "updated_at",
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    """Used by admins to create or update a product."""

    class Meta:
        model = Product
        fields = ["id", "category", "name", "description", "price", "inventory_quantity", "is_active"]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_inventory_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Inventory cannot be negative.")
        return value
