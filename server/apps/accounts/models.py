from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import TimeStampedModel


class UserManager(BaseUserManager):
    """
    Custom manager because we log in with email, not username.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)
 

class User(AbstractUser):
    """
    Custom user with email as the login field instead of username.
    """
    username = None
    email = models.EmailField(unique=True)
 
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
 
    objects = UserManager()
 
    def __str__(self):
        return self.email


class Address(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f'{self.line1}, {self.city}'
