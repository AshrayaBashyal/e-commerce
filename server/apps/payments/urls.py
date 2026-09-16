from django.urls import path

from .views import CreateCheckoutSessionView, PaymentDetailView, PaymentListView, StripeWebhookView

urlpatterns = [
    path("", PaymentListView.as_view(), name="payment-list"),
    path("create-checkout-session/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("<int:pk>/", PaymentDetailView.as_view(), name="payment-detail"),
    path("webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
