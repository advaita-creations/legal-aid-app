"""Custom DRF permission classes for Legal Aid App.

Usage:
    from utils.permissions import IsAdvocate, IsAdmin, IsOwner

    class MyViewSet(ModelViewSet):
        permission_classes = [IsAdvocate]
"""
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class IsAdvocate(BasePermission):
    """Allow access only to users with the 'advocate' role."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        """Check if user has advocate role."""
        return (
            hasattr(request, "user_profile")
            and request.user_profile is not None
            and request.user_profile.get("role") == "advocate"
        )


class IsAdmin(BasePermission):
    """Allow access only to users with the 'admin' role."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        """Check if user has admin role."""
        return (
            hasattr(request, "user_profile")
            and request.user_profile is not None
            and request.user_profile.get("role") == "admin"
        )


class IsOwner(BasePermission):
    """Allow access only to the owner of the resource.

    Expects the model to have an `advocate_id` field matching
    the authenticated user's profile ID.
    """

    def has_object_permission(
        self, request: Request, view: APIView, obj: object
    ) -> bool:
        """Check if user owns the object."""
        if not hasattr(request, "user_profile") or request.user_profile is None:
            return False
        advocate_id = getattr(obj, "advocate_id", None)
        return str(advocate_id) == str(request.user_profile.get("id", ""))
