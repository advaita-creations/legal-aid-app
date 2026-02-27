"""Client views for API."""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Client
from .serializers import ClientSerializer, ClientDetailSerializer, ClientCreateSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet for Client CRUD operations."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return clients for the authenticated user."""
        return Client.objects.filter(advocate=self.request.user)
    
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
