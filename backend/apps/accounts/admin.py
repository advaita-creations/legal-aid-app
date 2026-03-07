"""Account admin for Legal Aid App."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(UserAdmin):
    """Admin configuration for custom Profile model."""

    model = Profile
    list_display = ("email", "full_name", "role", "is_active", "is_staff", "created_at")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "full_name")
    ordering = ("-created_at",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("full_name", "phone", "role", "avatar_url")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "password1", "password2", "role"),
        }),
    )
    readonly_fields = ("created_at", "updated_at")
