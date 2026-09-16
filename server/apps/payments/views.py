import stripe
from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdmin
from apps.orders.models import Order
from . import services
from .models import Payment
from .serializers import CheckoutSessionResponseSerializer, CreateCheckoutSessionSerializer, PaymentSerializer


class CreateCheckoutSessionView(APIView):
    """Start a Stripe Checkout session for one of the user's own orders."""

    @extend_schema(request=CreateCheckoutSessionSerializer, responses=CheckoutSessionResponseSerializer)
    def post(self, request):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(pk=serializer.validated_data["order_id"], user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            session = services.create_checkout_session(order)
        except stripe.error.StripeError:
            return Response(
                {"error": "Could not start payment. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"checkout_url": session.url, "session_id": session.id})


class PaymentListView(generics.ListAPIView):
    """List payments. Admins see all; normal users see only their own."""
 
    serializer_class = PaymentSerializer
 
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): 
            return Payment.objects.none()
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all().order_by("-created_at")
        return Payment.objects.filter(order__user=user).order_by("-created_at")


class PaymentDetailView(generics.RetrieveAPIView):
    """View a payment record. Users see only their own."""

    serializer_class = PaymentSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Payment.objects.none()
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(order__user=user)


class StripeWebhookView(APIView):
    """Receive and verify Stripe webhook events."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(exclude=True)
    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event_type = event["type"]
        session = event["data"]["object"]

        if event_type == "checkout.session.completed":
            services.process_checkout_completed(session)
        elif event_type == "checkout.session.expired":
            services.process_checkout_expired(session)

        return Response(status=status.HTTP_200_OK)
