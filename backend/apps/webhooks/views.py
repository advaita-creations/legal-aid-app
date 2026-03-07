"""Webhook views for n8n integration.

Inbound endpoint receives processing results from n8n with up to 3 output files.
Supports three input modes per file:
  1. Multipart file upload (output_html, output_json, output_report)
  2. Google Drive / external URL (output_html_url, output_json_url, output_report_url)
  3. Pre-stored Supabase path (output_html_path, output_json_path, output_report_path)
"""
import logging
import os
from io import BytesIO
from typing import Optional

import httpx
from django.core.files.uploadedfile import InMemoryUploadedFile, SimpleUploadedFile
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.documents.models import Document, DocumentStatusHistory

logger = logging.getLogger(__name__)

CONTENT_TYPE_MAP = {
    'output_html': 'text/html',
    'output_json': 'application/json',
    'output_report': 'text/plain',
}


def _download_from_url(url: str, field_name: str) -> Optional[SimpleUploadedFile]:
    """Download a file from an external URL (e.g. Google Drive) and return as UploadedFile."""
    try:
        # Handle Google Drive links — convert to direct download URL
        if 'drive.google.com' in url:
            if '/file/d/' in url:
                file_id = url.split('/file/d/')[1].split('/')[0]
                url = f"https://drive.google.com/uc?export=download&id={file_id}"
            elif 'id=' in url:
                file_id = url.split('id=')[1].split('&')[0]
                url = f"https://drive.google.com/uc?export=download&id={file_id}"

        with httpx.Client(timeout=60.0, follow_redirects=True) as client:
            response = client.get(url)

        if response.status_code != 200:
            logger.error("Download failed for %s (%s): %s", field_name, url, response.status_code)
            return None

        content_type = CONTENT_TYPE_MAP.get(field_name, 'application/octet-stream')
        filename = f"{field_name}.{content_type.split('/')[-1]}"
        return SimpleUploadedFile(filename, response.content, content_type=content_type)
    except Exception:
        logger.exception("Failed to download %s from %s", field_name, url)
        return None


def _store_processed_file(
    file_obj,
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
        - output_html / output_json / output_report (file): Direct file uploads.
        - output_html_url / output_json_url / output_report_url (str): External URLs to download.
        - output_html_path / output_json_path / output_report_path (str): Pre-stored paths.
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

    file_map = {
        'output_html': ('processed_html_path', 'output_final.html'),
        'output_json': ('processed_json_path', 'output_consolidated.json'),
        'output_report': ('processed_report_path', 'output_validation_report.txt'),
    }

    for field_name, (model_field, default_suffix) in file_map.items():
        # Priority 1: Direct file upload
        file_obj = request.FILES.get(field_name)
        if file_obj:
            path = _store_processed_file(file_obj, document, default_suffix)
            if path:
                setattr(document, model_field, path)
            continue

        # Priority 2: External URL (Google Drive, etc.)
        url_value = request.data.get(f'{field_name}_url')
        if url_value:
            downloaded = _download_from_url(url_value, field_name)
            if downloaded:
                path = _store_processed_file(downloaded, document, default_suffix)
                if path:
                    setattr(document, model_field, path)
            continue

        # Priority 3: Pre-stored path
        path_value = request.data.get(f'{field_name}_path')
        if path_value:
            setattr(document, model_field, path_value)

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
