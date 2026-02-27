"""Document views for API."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Document
from .serializers import DocumentSerializer, DocumentCreateSerializer, DocumentStatusSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Document CRUD operations."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return documents for the authenticated user."""
        return Document.objects.filter(
            advocate=self.request.user,
        ).select_related('case', 'case__client')

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        """Set the advocate to the current user when creating."""
        serializer.save(advocate=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create document and return full serialized response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        doc = Document.objects.select_related('case', 'case__client').get(pk=serializer.instance.pk)
        return Response(
            DocumentSerializer(doc).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """Update document status with validation of transitions."""
        document = self.get_object()
        serializer = DocumentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']

        if not document.can_transition_to(new_status):
            return Response(
                {'error': f'Cannot transition from {document.status} to {new_status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document.status = new_status
        document.save(update_fields=['status', 'updated_at'])

        return Response(DocumentSerializer(document).data)
