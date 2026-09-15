from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


class UserAdmin(DjangoUserAdmin):
    ordering = ["email"]
    list_display = ["email", "full_name", "is_staff", "is_superuser", "is_active"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"fields": ("email", "full_name", "password1", "password2")}),
    )
    search_fields = ["email", "full_name"]


admin.site.register(User, UserAdmin)
