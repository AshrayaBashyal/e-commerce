from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import CartItem
from .serializers import AddCartItemSerializer, CartSerializer, UpdateCartItemSerializer


class CartView(APIView):
    """Get the current user's cart."""

    @extend_schema(responses=CartSerializer)
    def get(self, request):
        cart = services.get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)


class CartItemCreateView(APIView):
    """Add a product to the cart. Increases quantity if already present."""

    @extend_schema(request=AddCartItemSerializer, responses=CartSerializer)
    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.product
        quantity = serializer.validated_data["quantity"]

        cart = services.get_or_create_cart(request.user)
        services.add_item(cart, product, quantity)

        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)


class CartItemUpdateDeleteView(APIView):
    """Update the quantity of a cart item, or remove it."""

    def get_item(self, request, pk):
        return CartItem.objects.select_related("product", "cart").get(pk=pk, cart__user=request.user)

    @extend_schema(request=UpdateCartItemSerializer, responses=CartSerializer)
    def patch(self, request, pk):
        try:
            item = self.get_item(request, pk)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.update_item_quantity(item, serializer.validated_data["quantity"])

        return Response(CartSerializer(item.cart).data)

    @extend_schema(request=None, responses={204: None})
    def delete(self, request, pk):
        try:
            item = self.get_item(request, pk)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartClearView(APIView):
    """Remove all items from the cart."""

    @extend_schema(request=None, responses={204: None})
    def delete(self, request):
        cart = services.get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
