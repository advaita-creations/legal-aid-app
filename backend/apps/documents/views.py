"""Document views for API."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from utils.storage import get_storage_backend

from .models import Document, DocumentStatusHistory
from .serializers import DocumentSerializer, DocumentCreateSerializer, DocumentStatusSerializer
from apps.webhooks.outbound import notify_n8n_ready_to_process
from apps.webhooks.drive_poller import start_drive_poller


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Document CRUD operations."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'file_type', 'case']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return documents. Admin sees all; advocates see own."""
        qs = Document.objects.select_related('case', 'case__client').prefetch_related(
            'status_history', 'status_history__changed_by',
        )
        if self.request.user.role != 'admin':
            qs = qs.filter(advocate=self.request.user)
        return qs

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentSerializer

    def get_serializer_context(self):
        """Pass request to serializer context for building file URLs."""
        return {**super().get_serializer_context(), 'request': self.request}

    def create(self, request, *args, **kwargs):
        """Create document with file upload and return full serialized response."""
        context = self.get_serializer_context()
        context['advocate'] = request.user
        serializer = self.get_serializer(data=request.data, context=context)
        serializer.is_valid(raise_exception=True)
        doc = serializer.save()
        DocumentStatusHistory.objects.create(
            document=doc,
            from_status=None,
            to_status='uploaded',
            changed_by=request.user,
        )
        doc = Document.objects.select_related('case', 'case__client').prefetch_related(
            'status_history', 'status_history__changed_by',
        ).get(pk=doc.pk)
        return Response(
            DocumentSerializer(doc, context={'request': request}).data,
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
            result = notify_n8n_ready_to_process(
                document_id=document.id,
                document_name=document.name,
                file_path=document.file_path,
                case_title=document.case.title,
                advocate_email=request.user.email,
            )
            if result is not None:
                document.status = 'in_progress'
                document.save(update_fields=['status', 'updated_at'])
                DocumentStatusHistory.objects.create(
                    document=document,
                    from_status='ready_to_process',
                    to_status='in_progress',
                    changed_by=None,
                    notes='Auto-transitioned: n8n acknowledged processing request',
                )
            # MVP: Start polling Google Drive for processed output files
            start_drive_poller(document.id)

        doc = Document.objects.select_related('case', 'case__client').prefetch_related(
            'status_history', 'status_history__changed_by',
        ).get(pk=document.pk)
        return Response(DocumentSerializer(doc).data)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """Return a download URL for the document file."""
        document = self.get_object()
        backend = get_storage_backend()
        url = backend.get_url(document.file_path, request=request)
        if not url:
            return Response(
                {'error': 'File not available'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({
            'url': url,
            'name': document.name,
            'mime_type': document.mime_type,
        })
