"""Webhook views for n8n integration.

Inbound endpoint receives processing results from n8n with up to 3 output files:
  - output_html: Validated HTML document
  - output_json: Consolidated JSON data
  - output_report: Validation report (text)

Supports both multipart/form-data (files) and JSON (file paths) payloads.
"""
import logging
import os
from typing import Optional

from django.core.files.uploadedfile import InMemoryUploadedFile
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.documents.models import Document, DocumentStatusHistory

logger = logging.getLogger(__name__)


def _store_processed_file(
    file_obj: InMemoryUploadedFile,
    document: Document,
    suffix: str,
) -> Optional[str]:
    """Upload a processed output file to storage and return the path."""
    from utils.storage import get_storage_backend

    relative_path = f"{document.advocate_id}/{document.case_id}/processed/{document.id}_{suffix}"
    backend = get_storage_backend()
    try:
        stored_path = backend.upload(file_obj, relative_path)
        return stored_path
    except Exception:
        logger.exception("Failed to store processed file %s for document %s", suffix, document.id)
        return None


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def n8n_webhook_view(request):
    """Inbound webhook from n8n for document processing results.

    Accepts:
        - document_id (required): ID of the document being processed.
        - status (optional): New status, defaults to 'processed'.
        - output_html (file): Validated HTML document.
        - output_json (file): Consolidated JSON data.
        - output_report (file): Validation report text.
        - output_html_path (str): Pre-stored path for HTML (if files not sent).
        - output_json_path (str): Pre-stored path for JSON.
        - output_report_path (str): Pre-stored path for report.
    """
    secret = request.headers.get('X-Webhook-Secret', '')
    expected = os.environ.get('N8N_WEBHOOK_SECRET', '')
    if expected and secret != expected:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    document_id = request.data.get('document_id')
    if not document_id:
        return Response(
            {"error": "document_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        document = Document.objects.select_related('case').get(id=document_id)
    except Document.DoesNotExist:
        return Response(
            {"error": "Document not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Store uploaded files (multipart) or accept pre-stored paths (JSON)
    file_map = {
        'output_html': ('processed_html_path', 'output_final.html'),
        'output_json': ('processed_json_path', 'output_consolidated.json'),
        'output_report': ('processed_report_path', 'output_validation_report.txt'),
    }

    for field_name, (model_field, default_suffix) in file_map.items():
        file_obj = request.FILES.get(field_name)
        if file_obj:
            path = _store_processed_file(file_obj, document, default_suffix)
            if path:
                setattr(document, model_field, path)
        else:
            path_value = request.data.get(f'{field_name}_path')
            if path_value:
                setattr(document, model_field, path_value)

    # Legacy single output path
    output_path = request.data.get('output_file_path')
    if output_path:
        document.processed_output_path = output_path

    new_status = request.data.get('status', 'processed')
    old_status = document.status
    document.status = new_status
    document.save()

    DocumentStatusHistory.objects.create(
        document=document,
        from_status=old_status,
        to_status=new_status,
        changed_by=None,
        notes='Processed by n8n workflow',
    )

    logger.info("n8n webhook: document %s updated to %s", document.id, new_status)

    return Response({
        "ok": True,
        "document_id": str(document.id),
        "updated_status": document.status,
        "processed_files": {
            "html": bool(document.processed_html_path),
            "json": bool(document.processed_json_path),
            "report": bool(document.processed_report_path),
        },
    })
