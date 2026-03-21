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
    logger.info(
        "[DOC_SAVE_VER] doc_id=%s name='%s' status=%s user=%s content_length=%d",
        doc.id, doc.name, doc.status, request.user.email,
        len(request.data.get('html_content', '')),
    )

    html_content = request.data.get('html_content', '')
    notes = request.data.get('notes', '')

    if not html_content:
        logger.warning("[DOC_SAVE_VER] REJECTED doc_id=%s empty html_content", doc.id)
        return Response(
            {'error': 'html_content is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Determine next version number
    latest = doc.versions.order_by('-version_number').first()
    next_number = (latest.version_number + 1) if latest else 1
    logger.info("[DOC_SAVE_VER] doc_id=%s next_version=%d prev_version=%s", doc.id, next_number, latest.version_number if latest else 'none')

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
        logger.info("[DOC_SAVE_VER] doc_id=%s stored path=%s", doc.id, stored_path)
    except Exception:
        logger.exception("[DOC_SAVE_VER] FAILED doc_id=%s storage upload for v%d", doc.id, next_number)
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
        "[DOC_SAVE_VER] SUCCESS doc_id=%s v%d by %s (%d bytes) path=%s",
        doc.id, next_number, request.user.email, len(html_content), stored_path,
    )

    return Response(
        DocumentVersionSerializer(version).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_pdf(request: Request, pk: int) -> Response:
    """Generate a PDF from the current HTML and finalize the document.

    POST /api/v2/documents/<pk>/generate-pdf/

    Takes the latest processed HTML, converts it to PDF using xhtml2pdf,
    stores the PDF in Supabase, transitions document to 'finalized',
    and returns the PDF URL.
    """
    doc = _get_document_for_user(pk, request.user)

    if doc.status != 'processed':
        return Response(
            {'error': 'Document must be processed before generating PDF.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not doc.processed_html_path:
        return Response(
            {'error': 'No processed HTML available to generate PDF from.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Download the latest HTML from storage
        from utils.storage import get_storage_backend
        import httpx as httpx_client

        backend = get_storage_backend()
        html_url = backend.get_url(doc.processed_html_path)

        html_content = b''
        if html_url:
            with httpx_client.Client(timeout=30.0, follow_redirects=True) as client:
                resp = client.get(html_url)
            if resp.status_code == 200:
                html_content = resp.content

        if not html_content:
            return Response(
                {'error': 'Failed to download HTML content.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Wrap in proper HTML document for xhtml2pdf
        html_text = html_content.decode('utf-8', errors='replace')
        if '<html' not in html_text.lower():
            html_text = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
body {{ font-family: Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.5; margin: 30px; }}
h1 {{ font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px; }}
h2 {{ font-size: 14px; font-weight: bold; color: #444; margin-top: 20px; }}
table {{ border-collapse: collapse; width: 100%; margin: 10px 0; }}
td, th {{ border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 10px; }}
th {{ background-color: #f0f0f0; font-weight: bold; }}
mark {{ background-color: #ffeb3b; padding: 1px 3px; }}
</style>
</head>
<body>
{html_text}
</body>
</html>"""

        # Generate PDF using xhtml2pdf
        import io
        from xhtml2pdf import pisa

        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(
            io.StringIO(html_text),
            dest=pdf_buffer,
            encoding='utf-8',
        )

        if pisa_status.err:
            logger.error("xhtml2pdf error generating PDF for doc %s: %s", pk, pisa_status.err)
            return Response(
                {'error': 'PDF generation failed.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        pdf_bytes = pdf_buffer.getvalue()
        logger.info("Generated PDF for doc %s: %d bytes", pk, len(pdf_bytes))

        # Store PDF in Supabase
        from django.core.files.uploadedfile import SimpleUploadedFile

        prefix = os.path.splitext(doc.name)[0].replace(' ', '_')
        pdf_filename = f'{prefix}_extracted.pdf'
        relative_path = f"{doc.advocate_id}/{doc.case_id}/processed/{doc.id}_{pdf_filename}"

        file_obj = SimpleUploadedFile(pdf_filename, pdf_bytes, 'application/pdf')
        stored_path = backend.upload(file_obj, relative_path)

        # Update document: set extracted PDF path and transition to finalized
        old_status = doc.status
        doc.extracted_pdf_path = stored_path
        doc.status = 'finalized'
        doc.save(update_fields=['extracted_pdf_path', 'status', 'updated_at'])

        # Log status history
        DocumentStatusHistory.objects.create(
            document=doc,
            from_status=old_status,
            to_status='finalized',
            changed_by=request.user,
            notes=f"PDF generated ({len(pdf_bytes)} bytes) and document finalized.",
        )

        logger.info(
            "Document %s finalized: PDF stored at %s (%d bytes) by %s",
            doc.id, stored_path, len(pdf_bytes), request.user.email,
        )

        # Return the PDF URL
        pdf_url = backend.get_url(stored_path)

        return Response({
            'ok': True,
            'pdf_url': pdf_url,
            'pdf_path': stored_path,
            'pdf_size': len(pdf_bytes),
            'status': 'finalized',
        })

    except Exception as exc:
        logger.exception("Failed to generate PDF for document %s", pk)
        return Response(
            {'error': f'PDF generation failed: {str(exc)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalize_to_rag(request: Request, pk: int) -> Response:
    """Finalize document and push to RAG webhook for vector indexing.

    POST /api/v2/documents/<pk>/finalize-rag/

    Sends client_name, case_id, and the latest version HTML to the RAG webhook.
    n8n inserts the content into the Pinecone vector DB.
    """
    try:
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

        files = {}
        form_data = {
            'client_name': client_name,
            'case_id': str(doc.case_id),
            'document_id': str(doc.id),
            'version': str(version_number),
        }

        # Pinecone works best with txt files — only send report (txt), not HTML
        if report_content:
            files[f'{prefix}_v{version_number}_txt'] = (
                f'{prefix}_v{version_number}.txt', report_content, 'text/plain',
            )

        # Log RAG file upload details
        file_details = ', '.join([f"{k}({len(v[1])} bytes)" for k, v in files.items()])
        logger.info(
            "Sending RAG finalize for doc %s v%d (client=%s, case=%s, files=%s)",
            doc.id, version_number, client_name, doc.case_id, file_details,
        )
        
        # Record in status history for user visibility
        DocumentStatusHistory.objects.create(
            document=doc,
            from_status=doc.status,
            to_status=doc.status,
            changed_by=request.user,
            notes=f"RAG finalize: Uploading {len(files)} files to n8n ({file_details})",
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
        
        # Record response in status history
        DocumentStatusHistory.objects.create(
            document=doc,
            from_status=doc.status,
            to_status=doc.status,
            changed_by=request.user,
            notes=f"RAG response: {resp.status_code} — {resp.text[:200]}",
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
        logger.error("RAG finalize failed for document %s: %s", pk, exc)
        return Response(
            {'error': f'RAG webhook failed: {str(exc)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as exc:
        logger.exception("Unexpected error in RAG finalize for document %s", pk)
        return Response(
            {'error': f'Internal error: {str(exc)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
    logger.info(
        "[DOC_REVERT] doc_id=%s reverting to version_id=%s (v%d) by %s old_path=%s new_path=%s",
        doc.id, version_id, version.version_number, request.user.email,
        doc.processed_html_path, version.html_path,
    )

    doc.processed_html_path = version.html_path
    doc.save(update_fields=['processed_html_path', 'updated_at'])

    logger.info(
        "[DOC_REVERT] SUCCESS doc_id=%s reverted to v%d by %s",
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
