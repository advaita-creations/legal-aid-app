"""Account models for Legal Aid App.

Custom user model with UUID primary key, compatible with both
SQLite (dev) and Supabase Postgres (prod).
"""
import uuid
from typing import Optional

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


class ProfileManager(BaseUserManager):
    """Custom manager for Profile model."""

    def create_user(
        self,
        email: str,
        password: Optional[str] = None,
        **extra_fields,
    ) -> "Profile":
        """Create and return a regular user with the given email and password."""
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        extra_fields.setdefault("role", "advocate")
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        password: Optional[str] = None,
        **extra_fields,
    ) -> "Profile":
        """Create and return a superuser (admin role)."""
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class Profile(AbstractBaseUser, PermissionsMixin):
    """Custom user model with UUID PK matching Supabase profiles table."""

    ROLE_CHOICES = [
        ("advocate", "Advocate"),
        ("admin", "Admin"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="advocate")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    avatar_url = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProfileManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self) -> str:
        return self.full_name or self.email

    def get_full_name(self) -> str:
        """Return the user's full name."""
        return self.full_name or self.email

    def get_short_name(self) -> str:
        """Return the user's short name."""
        return self.full_name.split(" ")[0] if self.full_name else self.email
