from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "order", "amount", "currency", "status", "created_at", "updated_at"]
        read_only_fields = fields


class CreateCheckoutSessionSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()


class CheckoutSessionResponseSerializer(serializers.Serializer):
    checkout_url = serializers.URLField()
    session_id = serializers.CharField()
