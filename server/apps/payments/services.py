import stripe
from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.cart.services import get_or_create_cart
from apps.orders.models import Order
from apps.products.models import Product
from .models import Payment

stripe.api_key = settings.STRIPE_SECRET_KEY


def _get(obj, key, default=None):
    """Safe lookup for Stripe objects, which support [] but not .get()."""
    try:
        return obj[key]
    except (KeyError, TypeError):
        return default


def create_checkout_session(order):
    if order.status != Order.Status.PENDING or order.payment_status == Order.PaymentStatus.PAID:
        raise ValidationError("This order cannot be paid for.")

    line_items = [
        {
            "price_data": {
                "currency": "usd",
                "product_data": {"name": item.product_name},
                "unit_amount": int(item.unit_price * 100),
            },
            "quantity": item.quantity,
        }
        for item in order.items.all()
    ]

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        success_url=settings.FRONTEND_SUCCESS_URL + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=settings.FRONTEND_CANCEL_URL,
        metadata={"order_id": str(order.id)},
    )

    Payment.objects.update_or_create(
        order=order,
        defaults={
            "stripe_session_id": session.id,
            "amount": order.total_amount,
            "currency": "usd",
            "status": Payment.Status.PENDING,
        },
    )

    return session


@transaction.atomic
def process_checkout_completed(session):
    """Handle checkout.session.completed. Safe to call more than once."""

    order_id = _get(_get(session, "metadata", {}), "order_id")
    if not order_id:
        return

    try:
        payment = Payment.objects.select_for_update().select_related("order").get(order_id=order_id)
    except Payment.DoesNotExist:
        return

    if payment.status == Payment.Status.PAID:
        return

    order = payment.order

    product_ids = [pid for pid in order.items.values_list("product_id", flat=True) if pid]
    locked_products = {
        p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
    }

    for item in order.items.all():
        product = locked_products.get(item.product_id)
        if product:
            product.inventory_quantity = max(product.inventory_quantity - item.quantity, 0)
            product.save(update_fields=["inventory_quantity"])

    payment.status = Payment.Status.PAID
    payment.stripe_payment_intent_id = _get(session, "payment_intent") or ""
    payment.save(update_fields=["status", "stripe_payment_intent_id"])

    order.status = Order.Status.PROCESSING
    order.payment_status = Order.PaymentStatus.PAID
    order.save(update_fields=["status", "payment_status"])

    cart = get_or_create_cart(order.user)
    cart.items.all().delete()


@transaction.atomic
def process_checkout_expired(session):
    """Handle checkout.session.expired. Order stays PENDING, nothing was ever deducted."""

    order_id = _get(_get(session, "metadata", {}), "order_id")
    if not order_id:
        return

    try:
        payment = Payment.objects.select_for_update().get(order_id=order_id)
    except Payment.DoesNotExist:
        return

    if payment.status == Payment.Status.PAID:
        return

    payment.status = Payment.Status.FAILED
    payment.save(update_fields=["status"])
