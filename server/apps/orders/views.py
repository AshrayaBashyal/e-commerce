from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework import status as http_status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdmin
from . import services
from .models import Order
from .serializers import OrderSerializer, OrderStatusUpdateSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    """List own orders (all orders for admin), or create an order from the cart."""

    serializer_class = OrderSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Order.objects.none()
        user = self.request.user
        if user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=user)

    @extend_schema(
        request={"application/json": {"type": "object", "example": {}}},
        responses=OrderSerializer,
        description="Create an order from the current cart. No request body needed, send {}.",
    )
    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        order = services.create_order_from_cart(request.user)
        return Response(OrderSerializer(order).data, status=http_status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    """Retrieve a single order. Users see only their own."""

    serializer_class = OrderSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Order.objects.none()
        user = self.request.user
        if user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=user)


class OrderCancelView(APIView):
    """Cancel one of the current user's own orders."""

    @extend_schema(request=None, responses=OrderSerializer)
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=http_status.HTTP_404_NOT_FOUND)

        order = services.cancel_order(order)
        return Response(OrderSerializer(order).data)


class OrderStatusUpdateView(APIView):
    """Update an order's status. Admin only."""

    permission_classes = [IsAdmin]

    @extend_schema(request=OrderStatusUpdateSerializer, responses=OrderSerializer)
    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=http_status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = services.update_order_status(order, serializer.validated_data["status"])
        return Response(OrderSerializer(order).data)
