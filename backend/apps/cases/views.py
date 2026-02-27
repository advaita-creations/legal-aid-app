"""Case views for API."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Case
from .serializers import CaseSerializer, CaseCreateSerializer


class CaseViewSet(viewsets.ModelViewSet):
    """ViewSet for Case CRUD operations."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return cases for the authenticated user."""
        return Case.objects.filter(advocate=self.request.user).select_related('client')

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CaseCreateSerializer
        return CaseSerializer

    def perform_create(self, serializer):
        """Set the advocate to the current user when creating."""
        serializer.save(advocate=self.request.user)
