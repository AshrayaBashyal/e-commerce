from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.cart.services import get_or_create_cart
from apps.products.models import Product
from .models import Order, OrderItem

CANCELLABLE_STATUSES = [Order.Status.PENDING, Order.Status.PROCESSING]

ALLOWED_STATUS_TRANSITIONS = {
    Order.Status.PENDING: [Order.Status.CANCELLED],
    Order.Status.PROCESSING: [Order.Status.SHIPPED, Order.Status.CANCELLED],
    Order.Status.SHIPPED: [Order.Status.DELIVERED],
    Order.Status.DELIVERED: [],
    Order.Status.CANCELLED: [],
}


@transaction.atomic
def create_order_from_cart(user):
    cart = get_or_create_cart(user)
    cart_items = list(cart.items.select_related("product"))

    if not cart_items:
        raise ValidationError("Cart is empty.")

    product_ids = [item.product_id for item in cart_items]
    locked_products = {
        p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
    }

    order_items_data = []
    total = 0
    for cart_item in cart_items:
        product = locked_products.get(cart_item.product_id)
        if product is None or not product.is_active:
            raise ValidationError(f"{cart_item.product.name} is no longer available.")
        if cart_item.quantity > product.inventory_quantity:
            raise ValidationError(f"Only {product.inventory_quantity} left of {product.name}.")

        subtotal = product.price * cart_item.quantity
        total += subtotal
        order_items_data.append(
            {
                "product": product,
                "product_name": product.name,
                "unit_price": product.price,
                "quantity": cart_item.quantity,
                "subtotal": subtotal,
            }
        )

    order = Order.objects.create(user=user, total_amount=total)
    OrderItem.objects.bulk_create(OrderItem(order=order, **data) for data in order_items_data)

    return order


@transaction.atomic
def cancel_order(order):
    if order.status not in CANCELLABLE_STATUSES:
        raise ValidationError("This order cannot be cancelled.")

    if order.status == Order.Status.PROCESSING:
        product_ids = [pid for pid in order.items.values_list("product_id", flat=True) if pid]
        locked_products = {
            p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
        }
        for item in order.items.all():
            product = locked_products.get(item.product_id)
            if product:
                product.inventory_quantity += item.quantity
                product.save(update_fields=["inventory_quantity"])

    order.status = Order.Status.CANCELLED
    order.save(update_fields=["status"])
    return order


def update_order_status(order, new_status):
    allowed = ALLOWED_STATUS_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        raise ValidationError(f"Cannot move order from {order.status} to {new_status}.")
    order.status = new_status
    order.save(update_fields=["status"])
    return order
