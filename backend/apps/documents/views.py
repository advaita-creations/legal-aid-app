"""Document views for API."""
import logging

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

logger = logging.getLogger(__name__)


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
        logger.info(
            "[DOC_CREATE] user=%s case_id=%s file=%s",
            request.user.email,
            request.data.get('case', '?'),
            getattr(request.data.get('file'), 'name', '?'),
        )
        context = self.get_serializer_context()
        context['advocate'] = request.user
        serializer = self.get_serializer(data=request.data, context=context)
        serializer.is_valid(raise_exception=True)
        doc = serializer.save()
        logger.info(
            "[DOC_CREATE] doc_id=%s name='%s' file_path=%s size=%s mime=%s advocate=%s",
            doc.id, doc.name, doc.file_path, doc.file_size_bytes, doc.mime_type, request.user.email,
        )
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
        logger.info(
            "[DOC_STATUS] doc_id=%s name='%s' current=%s requested=%s user=%s",
            document.id, document.name, document.status, new_status, request.user.email,
        )

        if not document.can_transition_to(new_status):
            logger.warning(
                "[DOC_STATUS] BLOCKED doc_id=%s transition %s->%s not allowed",
                document.id, document.status, new_status,
            )
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
        logger.info(
            "[DOC_STATUS] SUCCESS doc_id=%s %s->%s user=%s",
            document.id, old_status, new_status, request.user.email,
        )

        if new_status == 'ready_to_process':
            # Clear stale processed paths on retry so files can be re-stored
            if old_status in ('in_progress', 'processed'):
                document.processed_html_path = None
                document.processed_json_path = None
                document.processed_report_path = None
                document.save(update_fields=[
                    'processed_html_path', 'processed_json_path', 'processed_report_path', 'updated_at',
                ])
                logger.info("Cleared processed paths for doc %s (retry from %s)", document.id, old_status)

            logger.info(
                "[DOC_N8N_SEND] doc_id=%s name='%s' file_path=%s case=%s client=%s",
                document.id, document.name, document.file_path,
                document.case.title, document.case.client.full_name if document.case.client else 'N/A',
            )
            result = notify_n8n_ready_to_process(
                document_id=document.id,
                document_name=document.name,
                file_path=document.file_path,
                case_title=document.case.title,
                advocate_email=request.user.email,
                client_name=document.case.client.full_name if document.case.client else '',
                case_id=document.case_id,
            )

            logger.info(
                "[DOC_N8N_RESULT] doc_id=%s result_type=%s keys=%s",
                document.id,
                type(result).__name__ if result else 'None',
                list(result.keys()) if isinstance(result, dict) else 'N/A',
            )

            if result is not None:
                files_stored = result.get('files_stored', {})
                if files_stored:
                    # Files came back in synchronous response — mark as processed
                    document.refresh_from_db()
                    document.status = 'processed'
                    document.save(update_fields=['status', 'updated_at'])
                    DocumentStatusHistory.objects.create(
                        document=document,
                        from_status='ready_to_process',
                        to_status='processed',
                        changed_by=None,
                        notes=f'Processed by n8n OCR: {len(files_stored)} file(s) returned directly',
                    )
                else:
                    # n8n responded 200 but no files extracted — mark in_progress, wait for callback
                    document.status = 'in_progress'
                    document.save(update_fields=['status', 'updated_at'])
                    DocumentStatusHistory.objects.create(
                        document=document,
                        from_status='ready_to_process',
                        to_status='in_progress',
                        changed_by=None,
                        notes='n8n acknowledged (200) but no files in response — waiting for async callback',
                    )
            else:
                # Request failed (timeout, network error, etc.) — still mark in_progress
                document.status = 'in_progress'
                document.save(update_fields=['status', 'updated_at'])
                DocumentStatusHistory.objects.create(
                    document=document,
                    from_status='ready_to_process',
                    to_status='in_progress',
                    changed_by=None,
                    notes='n8n request failed or timed out — waiting for async callback',
                )

        doc = Document.objects.select_related('case', 'case__client').prefetch_related(
            'status_history', 'status_history__changed_by',
        ).get(pk=document.pk)
        return Response(DocumentSerializer(doc).data)

    @action(detail=True, methods=['post'], url_path='upload-v2-files',
            parser_classes=[MultiPartParser, FormParser])
    def upload_v2_files(self, request, pk=None):
        """Upload v2 files generated by v1 HTML Save & Export.

        Accepts multipart upload with:
          - html_v2: Finalized HTML (clean, no editing UI)
          - txt_v2: Plain text version for RAG indexing
          - corrections_log: Audit log of all corrections made
        """
        import os
        document = self.get_object()
        logger.info(
            "[DOC_V2_UPLOAD] doc_id=%s name='%s' user=%s files=%s",
            document.id, document.name, request.user.email, list(request.FILES.keys()),
        )

        html_v2_file = request.FILES.get('html_v2')
        txt_v2_file = request.FILES.get('txt_v2')
        corrections_log_file = request.FILES.get('corrections_log')

        if not html_v2_file or not txt_v2_file or not corrections_log_file:
            logger.warning("[DOC_V2_UPLOAD] REJECTED doc_id=%s missing files", document.id)
            return Response(
                {'error': 'All 3 files required: html_v2, txt_v2, corrections_log'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        backend = get_storage_backend()
        prefix = os.path.splitext(document.name)[0].replace(' ', '_')
        base_path = f"{document.advocate_id}/{document.case_id}/processed/{document.id}"

        try:
            html_v2_path = backend.upload(
                html_v2_file, f"{base_path}_{prefix}_v2.html",
            )
            txt_v2_path = backend.upload(
                txt_v2_file, f"{base_path}_{prefix}_v2.txt",
            )
            corrections_log_path = backend.upload(
                corrections_log_file, f"{base_path}_{prefix}_corrections_log.txt",
            )

            document.html_v2_path = html_v2_path
            document.txt_v2_path = txt_v2_path
            document.corrections_log_path = corrections_log_path
            document.save(update_fields=[
                'html_v2_path', 'txt_v2_path', 'corrections_log_path', 'updated_at',
            ])

            DocumentStatusHistory.objects.create(
                document=document,
                from_status=document.status,
                to_status=document.status,
                changed_by=request.user,
                notes=f"V2 files uploaded: {html_v2_file.size + txt_v2_file.size + corrections_log_file.size} bytes total",
            )

            logger.info("[DOC_V2_UPLOAD] SUCCESS doc_id=%s all 3 files stored", document.id)
            return Response({
                'ok': True,
                'html_v2_path': html_v2_path,
                'txt_v2_path': txt_v2_path,
                'corrections_log_path': corrections_log_path,
            })

        except Exception:
            logger.exception("[DOC_V2_UPLOAD] FAILED doc_id=%s storage error", document.id)
            return Response(
                {'error': 'Failed to store v2 files'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """Return a download URL for the document file."""
        document = self.get_object()
        logger.info(
            "[DOC_DOWNLOAD] doc_id=%s name='%s' file_path=%s user=%s",
            document.id, document.name, document.file_path, request.user.email,
        )
        backend = get_storage_backend()
        url = backend.get_url(document.file_path, request=request)
        if not url:
            logger.warning("[DOC_DOWNLOAD] FAILED doc_id=%s file not available", document.id)
            return Response(
                {'error': 'File not available'},
                status=status.HTTP_404_NOT_FOUND,
            )
        logger.info("[DOC_DOWNLOAD] SUCCESS doc_id=%s url_length=%d", document.id, len(url))
        return Response({
            'url': url,
            'name': document.name,
            'mime_type': document.mime_type,
        })
