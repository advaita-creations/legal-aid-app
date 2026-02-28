"""Document views for API."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Document, DocumentStatusHistory
from .serializers import DocumentSerializer, DocumentCreateSerializer, DocumentStatusSerializer
from apps.webhooks.outbound import notify_n8n_ready_to_process


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Document CRUD operations."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'file_type', 'case']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return documents for the authenticated user."""
        return Document.objects.filter(
            advocate=self.request.user,
        ).select_related('case', 'case__client').prefetch_related(
            'status_history', 'status_history__changed_by',
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        """Set the advocate to the current user when creating."""
        doc = serializer.save(advocate=self.request.user)
        DocumentStatusHistory.objects.create(
            document=doc,
            from_status=None,
            to_status='uploaded',
            changed_by=self.request.user,
        )

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

        old_status = document.status
        document.status = new_status
        document.save(update_fields=['status', 'updated_at'])

        DocumentStatusHistory.objects.create(
            document=document,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
            notes=serializer.validated_data.get('notes', ''),
        )

        if new_status == 'ready_to_process':
            notify_n8n_ready_to_process(
                document_id=document.id,
                document_name=document.name,
                file_path=document.file_path,
                case_title=document.case.title,
                advocate_email=request.user.email,
            )

        doc = Document.objects.select_related('case', 'case__client').prefetch_related(
            'status_history', 'status_history__changed_by',
        ).get(pk=document.pk)
        return Response(DocumentSerializer(doc).data)
