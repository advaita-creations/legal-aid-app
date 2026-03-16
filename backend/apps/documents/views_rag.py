"""Views for document version saving, revert, RAG finalization, and processing logs.

Supports the post-OCR workflow:
  - Save edited HTML as a new version (v{n})
  - Revert to a previous version
  - Finalize and push to RAG webhook for vector indexing
  - Live processing / debug logs
"""
import logging
import os
from typing import Optional

import requests
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Document, DocumentStatusHistory, DocumentVersion
from .serializers_review import DocumentVersionSerializer

logger = logging.getLogger(__name__)


def _get_document_for_user(pk: int, user) -> Document:
    """Retrieve a document scoped to the requesting user (or admin)."""
    qs = Document.objects.select_related('case', 'case__client').all()
    if user.role != 'admin':
        qs = qs.filter(advocate=user)
    return get_object_or_404(qs, pk=pk)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_version(request: Request, pk: int) -> Response:
    """Save edited HTML content as a new document version.

    POST /api/v2/documents/<pk>/versions/save/
    Body: { "html_content": "<html>...", "notes": "Fixed paragraph 3" }

    Creates a new DocumentVersion with version_number incremented.
    Stores the HTML in Supabase and updates the document's processed_html_path.
    """
    doc = _get_document_for_user(pk, request.user)

    html_content = request.data.get('html_content', '')
    notes = request.data.get('notes', '')

    if not html_content:
        return Response(
            {'error': 'html_content is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Determine next version number
    latest = doc.versions.order_by('-version_number').first()
    next_number = (latest.version_number + 1) if latest else 1

    # Store HTML in Supabase
    from utils.storage import get_storage_backend
    from django.core.files.uploadedfile import SimpleUploadedFile

    prefix = os.path.splitext(doc.name)[0].replace(' ', '_')
    suffix = f'{prefix}_v{next_number}.html'
    relative_path = f"{doc.advocate_id}/{doc.case_id}/processed/{doc.id}_{suffix}"

    backend = get_storage_backend()
    file_obj = SimpleUploadedFile(suffix, html_content.encode('utf-8'), 'text/html')

    try:
        stored_path = backend.upload(file_obj, relative_path)
    except Exception:
        logger.exception("Failed to store version %d for document %s", next_number, doc.id)
        return Response(
            {'error': 'Failed to save version.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Create version record
    version = DocumentVersion.objects.create(
        document=doc,
        version_number=next_number,
        html_path=stored_path,
        json_path=doc.processed_json_path or '',
        created_by=request.user,
        notes=notes or f'Version {next_number} saved',
    )

    # Update document's processed HTML path to the latest version
    doc.processed_html_path = stored_path
    doc.save(update_fields=['processed_html_path', 'updated_at'])

    logger.info(
        "Document %s: saved version v%d by %s (%d bytes)",
        doc.id, next_number, request.user.email, len(html_content),
    )

    return Response(
        DocumentVersionSerializer(version).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalize_to_rag(request: Request, pk: int) -> Response:
    """Finalize document and push to RAG webhook for vector indexing.

    POST /api/v2/documents/<pk>/finalize-rag/

    Sends client_name, case_id, and the latest version HTML to the RAG webhook.
    n8n inserts the content into the Pinecone vector DB.
    """
    doc = _get_document_for_user(pk, request.user)

    if doc.status != 'processed':
        return Response(
            {'error': 'Document must be processed before finalization.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Get latest version info
    latest = doc.versions.order_by('-version_number').first()
    version_number = latest.version_number if latest else 1

    # Download the latest HTML from storage
    from utils.storage import get_storage_backend
    import httpx as httpx_client

    backend = get_storage_backend()
    html_url = backend.get_url(doc.processed_html_path)
    report_url = backend.get_url(doc.processed_report_path) if doc.processed_report_path else None

    html_content = b''
    report_content = b''

    if html_url:
        try:
            with httpx_client.Client(timeout=30.0, follow_redirects=True) as client:
                resp = client.get(html_url)
            if resp.status_code == 200:
                html_content = resp.content
        except Exception:
            logger.exception("Failed to download HTML for RAG finalization")

    if report_url:
        try:
            with httpx_client.Client(timeout=30.0, follow_redirects=True) as client:
                resp = client.get(report_url)
            if resp.status_code == 200:
                report_content = resp.content
        except Exception:
            logger.exception("Failed to download report for RAG finalization")

    # Build history log
    versions = doc.versions.order_by('version_number').all()
    history_lines = [f"Document: {doc.name}", f"Total versions: {version_number}", "---"]
    for v in versions:
        history_lines.append(
            f"v{v.version_number} — {v.created_at.strftime('%Y-%m-%d %H:%M')} "
            f"by {v.created_by.email if v.created_by else 'system'}: {v.notes}"
        )
    history_log = '\n'.join(history_lines).encode('utf-8')

    # Send to RAG webhook
    rag_url = os.environ.get('N8N_RAG_WEBHOOK_URL', '')
    if not rag_url:
        return Response(
            {'error': 'RAG webhook not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    client_name = doc.case.client.full_name if doc.case and doc.case.client else ''
    prefix = os.path.splitext(doc.name)[0].replace(' ', '_')

    secret = os.environ.get('N8N_WEBHOOK_SECRET', '')
    headers = {}
    if secret:
        headers['X-Webhook-Secret'] = secret

    try:
        files = {}
        form_data = {
            'client_name': client_name,
            'case_id': str(doc.case_id),
            'document_id': str(doc.id),
            'version': str(version_number),
        }

        if html_content:
            files[f'{prefix}_v{version_number}_html'] = (
                f'{prefix}_v{version_number}.html', html_content, 'text/html',
            )
        if report_content:
            files[f'{prefix}_v{version_number}_txt'] = (
                f'{prefix}_v{version_number}.txt', report_content, 'text/plain',
            )
        if history_log:
            files[f'{prefix}_history_log'] = (
                f'{prefix}_history.log', history_log, 'text/plain',
            )

        logger.info(
            "Sending RAG finalize for doc %s v%d (client=%s, case=%s, %d files)",
            doc.id, version_number, client_name, doc.case_id, len(files),
        )

        resp = requests.post(
            rag_url, data=form_data, files=files, headers=headers, timeout=60,
        )
        resp.raise_for_status()

        # Parse response — n8n may return plain text or JSON
        ct = resp.headers.get('Content-Type', '')
        logger.info(
            "RAG finalize raw response: status=%s ct='%s' size=%d body='%s'",
            resp.status_code, ct, len(resp.content), resp.text[:300],
        )

        if 'application/json' in ct:
            try:
                rag_result = resp.json()
                # Handle n8n wrappers: { "json": { ... } } or direct keys
                inner = rag_result.get('json', rag_result) if isinstance(rag_result, dict) else rag_result
                if isinstance(inner, dict):
                    rag_message = (
                        inner.get('response') or inner.get('message')
                        or inner.get('output') or inner.get('text')
                        or inner.get('status') or str(inner)
                    )
                elif isinstance(inner, str):
                    rag_message = inner
                else:
                    rag_message = str(rag_result)
            except Exception:
                rag_message = resp.text[:300]
        else:
            # Plain text response (e.g. "File uploaded successfully")
            rag_message = resp.text.strip()[:300] or 'Success'

        logger.info("RAG finalize result: %s", rag_message)

        return Response({
            'ok': True,
            'version': version_number,
            'rag_response': rag_message,
        })

    except requests.RequestException as exc:
        logger.error("RAG finalize failed for document %s: %s", doc.id, exc)
        return Response(
            {'error': f'RAG webhook failed: {str(exc)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revert_version(request: Request, pk: int, version_id: int) -> Response:
    """Revert document to a specific version.

    POST /api/v2/documents/<pk>/versions/<version_id>/revert/

    Sets the document's processed_html_path to the target version's html_path.
    """
    doc = _get_document_for_user(pk, request.user)
    version = get_object_or_404(DocumentVersion, document=doc, id=version_id)

    doc.processed_html_path = version.html_path
    doc.save(update_fields=['processed_html_path', 'updated_at'])

    logger.info(
        "Document %s: reverted to v%d by %s",
        doc.id, version.version_number, request.user.email,
    )

    return Response({
        'ok': True,
        'reverted_to': version.version_number,
        'html_path': version.html_path,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def processing_logs(request: Request, pk: int) -> Response:
    """Get processing / debug logs for a document.

    GET /api/v2/documents/<pk>/logs/

    Returns status history, version history, and webhook activity in
    a unified timeline for troubleshooting.
    """
    doc = _get_document_for_user(pk, request.user)

    entries = []

    # Status history
    for sh in doc.status_history.select_related('changed_by').order_by('changed_at'):
        entries.append({
            'timestamp': sh.changed_at.isoformat(),
            'type': 'status',
            'level': 'info',
            'message': f'Status: {sh.from_status or "—"} → {sh.to_status}',
            'detail': sh.notes or '',
            'actor': sh.changed_by.email if sh.changed_by else 'system',
        })

    # Version history
    for v in doc.versions.select_related('created_by').order_by('created_at'):
        entries.append({
            'timestamp': v.created_at.isoformat(),
            'type': 'version',
            'level': 'info',
            'message': f'Version v{v.version_number} created',
            'detail': v.notes or '',
            'actor': v.created_by.email if v.created_by else 'system',
        })

    # Webhook / processing metadata
    if doc.processed_html_path:
        entries.append({
            'timestamp': doc.updated_at.isoformat(),
            'type': 'file',
            'level': 'success',
            'message': f'Processed HTML stored: {doc.processed_html_path.split("/")[-1]}',
            'detail': doc.processed_html_path,
            'actor': 'n8n',
        })
    if doc.processed_report_path:
        entries.append({
            'timestamp': doc.updated_at.isoformat(),
            'type': 'file',
            'level': 'success',
            'message': f'Report stored: {doc.processed_report_path.split("/")[-1]}',
            'detail': doc.processed_report_path,
            'actor': 'n8n',
        })

    # Sort by timestamp
    entries.sort(key=lambda e: e['timestamp'])

    return Response({
        'document_id': doc.id,
        'document_name': doc.name,
        'current_status': doc.status,
        'entries': entries,
    })
