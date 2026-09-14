from adrf.serializers import ModelSerializer as AsyncModelSerializer
from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import Address, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name']

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(AsyncModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined']


class AddressSerializer(AsyncModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'line1', 'line2', 'city', 'state','postal_code', 'country', 'is_default',
        ]