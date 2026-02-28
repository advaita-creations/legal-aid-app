"""Client views for API."""
from rest_framework import viewsets, status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Client
from .serializers import ClientSerializer, ClientDetailSerializer, ClientCreateSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet for Client CRUD operations."""
    
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['full_name', 'email', 'phone']
    ordering_fields = ['full_name', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return non-deleted clients. Admin sees all; advocates see own."""
        qs = Client.objects.filter(is_deleted=False)
        if not self.request.user.is_staff:
            qs = qs.filter(advocate=self.request.user)
        return qs
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ClientCreateSerializer
        if self.action == 'retrieve':
            return ClientDetailSerializer
        return ClientSerializer
    
    def perform_create(self, serializer):
        """Set the advocate to the current user when creating."""
        serializer.save(advocate=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Soft delete: set is_deleted=True instead of removing the record."""
        instance = self.get_object()
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])
        return Response(status=status.HTTP_204_NO_CONTENT)
