from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Cart, CartItem


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def validate_product_available(product, quantity):
    if not product.is_active:
        raise ValidationError("This product is not available.")
    if quantity <= 0:
        raise ValidationError("Quantity must be positive.")
    if quantity > product.inventory_quantity:
        raise ValidationError(f"Only {product.inventory_quantity} left in stock.")


@transaction.atomic
def add_item(cart, product, quantity):
    validate_product_available(product, quantity)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": quantity})
    if not created:
        new_quantity = item.quantity + quantity
        validate_product_available(product, new_quantity)
        item.quantity = new_quantity
        item.save(update_fields=["quantity"])
    return item


@transaction.atomic
def update_item_quantity(item, quantity):
    validate_product_available(item.product, quantity)
    item.quantity = quantity
    item.save(update_fields=["quantity"])
    return item
