"""Case views for API."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated

from .models import Case
from .serializers import CaseSerializer, CaseCreateSerializer


class CaseViewSet(viewsets.ModelViewSet):
    """ViewSet for Case CRUD operations."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'case_number']
    ordering_fields = ['title', 'created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return cases. Admin sees all; advocates see own."""
        qs = Case.objects.select_related('client')
        if not self.request.user.is_staff:
            qs = qs.filter(advocate=self.request.user)
        return qs

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CaseCreateSerializer
        return CaseSerializer

    def perform_create(self, serializer):
        """Set the advocate to the current user when creating."""
        serializer.save(advocate=self.request.user)
