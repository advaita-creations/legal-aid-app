"""Views for document version saving, revert, RAG finalization, and processing logs.

Supports the post-OCR workflow:
  - Save edited HTML as a new version (v{n})
  - Revert to a previous version
  - Finalize and push to RAG webhook for vector indexing
  - Upload v2 files from interactive HTML Save & Export
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

from .models import Document, DocumentActivityLog, DocumentStatusHistory, DocumentVersion
from .serializers_review import DocumentVersionSerializer

logger = logging.getLogger(__name__)


def _log_activity(
    doc: Document,
    event_type: str,
    message: str,
    detail: str = '',
    actor: str = 'system',
) -> None:
    """Create a high-level activity log entry for user tracking."""
    try:
        DocumentActivityLog.objects.create(
            document=doc,
            event_type=event_type,
            message=message,
            detail=detail,
            actor=actor,
        )
    except Exception:
        logger.exception("Failed to create activity log for doc %s", doc.id)


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

    _log_activity(
        doc, 'version_saved',
        f'Version v{next_number} saved ({len(html_content):,} bytes)',
        detail=notes or f'HTML content saved to storage',
        actor=request.user.email,
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

        _log_activity(
            doc, 'pdf_generated',
            f'PDF generated ({len(pdf_bytes):,} bytes) and document finalized',
            detail=pdf_filename,
            actor=request.user.email,
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
        
        # Use v2 TXT file if available (finalized by user), otherwise fall back to report
        txt_path = doc.txt_v2_path if doc.txt_v2_path else doc.processed_report_path
        txt_url = backend.get_url(txt_path) if txt_path else None

        txt_content = b''

        if txt_url:
            try:
                with httpx_client.Client(timeout=30.0, follow_redirects=True) as client:
                    resp = client.get(txt_url)
                if resp.status_code == 200:
                    txt_content = resp.content
                    logger.info(
                        "[DOC_RAG] doc_id=%s downloaded txt file: %s (%d bytes)",
                        doc.id, 'v2.txt' if doc.txt_v2_path else 'report.txt', len(txt_content),
                    )
            except Exception:
                logger.exception("[DOC_RAG] Failed to download TXT for RAG finalization")

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
        case_name = doc.case.title if doc.case else ''
        prefix = os.path.splitext(doc.name)[0].replace(' ', '_')

        secret = os.environ.get('N8N_WEBHOOK_SECRET', '')
        headers = {}
        if secret:
            headers['X-Webhook-Secret'] = secret

        files = {}
        form_data = {
            'client_name': client_name,
            'case_name': case_name,
            'document_id': str(doc.id),
            'version': str(version_number),
        }

        # Send v2 TXT file to Pinecone (finalized text after user edits)
        if txt_content:
            file_type = 'v2' if doc.txt_v2_path else 'report'
            files[f'{prefix}_{file_type}'] = (
                f'{prefix}_{file_type}.txt', txt_content, 'text/plain',
            )

        # Log RAG file upload details
        file_details = ', '.join([f"{k}({len(v[1])} bytes)" for k, v in files.items()])
        logger.info(
            "[DOC_RAG] Sending RAG finalize for doc %s v%d (client_name=%s, case_name=%s, files=%s)",
            doc.id, version_number, client_name, case_name, file_details,
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

        _log_activity(
            doc, 'rag_push',
            f'Document pushed to RAG (v{version_number}, {len(files)} files)',
            detail=f'Files: {file_details}',
            actor=request.user.email,
        )
        _log_activity(
            doc, 'rag_response',
            f'RAG response: {rag_message[:200]}',
            actor='n8n',
        )

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

    _log_activity(
        doc, 'version_reverted',
        f'Reverted to version v{version.version_number}',
        actor=request.user.email,
    )

    return Response({
        'ok': True,
        'reverted_to': version.version_number,
        'html_path': version.html_path,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_v2_files(request: Request, pk: int) -> Response:
    """Upload v2 files generated by v1 HTML Save & Export.

    POST /api/v2/documents/<pk>/upload-v2-files/
    
    Accepts multipart upload with:
      - html_v2: Finalized HTML (clean, no editing UI)
      - txt_v2: Plain text version for RAG indexing
      - corrections_log: Audit log of all corrections made
    
    Stores all files in Supabase and updates document model.
    """
    doc = _get_document_for_user(pk, request.user)
    logger.info(
        "[DOC_V2_UPLOAD] doc_id=%s name='%s' user=%s files=%s",
        doc.id, doc.name, request.user.email, list(request.FILES.keys()),
    )

    html_v2_file = request.FILES.get('html_v2')
    txt_v2_file = request.FILES.get('txt_v2')
    corrections_log_file = request.FILES.get('corrections_log')

    if not html_v2_file or not txt_v2_file or not corrections_log_file:
        logger.warning("[DOC_V2_UPLOAD] REJECTED doc_id=%s missing files", doc.id)
        return Response(
            {'error': 'All 3 files required: html_v2, txt_v2, corrections_log'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from utils.storage import get_storage_backend
    backend = get_storage_backend()

    prefix = os.path.splitext(doc.name)[0].replace(' ', '_')
    base_path = f"{doc.advocate_id}/{doc.case_id}/processed/{doc.id}"

    try:
        # Store v2 HTML
        html_v2_path = backend.upload(
            html_v2_file,
            f"{base_path}_{prefix}_v2.html",
        )
        logger.info("[DOC_V2_UPLOAD] doc_id=%s html_v2 stored: %s", doc.id, html_v2_path)

        # Store v2 TXT
        txt_v2_path = backend.upload(
            txt_v2_file,
            f"{base_path}_{prefix}_v2.txt",
        )
        logger.info("[DOC_V2_UPLOAD] doc_id=%s txt_v2 stored: %s", doc.id, txt_v2_path)

        # Store corrections log
        corrections_log_path = backend.upload(
            corrections_log_file,
            f"{base_path}_{prefix}_corrections_log.txt",
        )
        logger.info("[DOC_V2_UPLOAD] doc_id=%s corrections_log stored: %s", doc.id, corrections_log_path)

        # Update document
        doc.html_v2_path = html_v2_path
        doc.txt_v2_path = txt_v2_path
        doc.corrections_log_path = corrections_log_path
        doc.save(update_fields=['html_v2_path', 'txt_v2_path', 'corrections_log_path', 'updated_at'])

        # Log in status history
        DocumentStatusHistory.objects.create(
            document=doc,
            from_status=doc.status,
            to_status=doc.status,
            changed_by=request.user,
            notes=f"V2 files uploaded: {html_v2_file.size + txt_v2_file.size + corrections_log_file.size} bytes total",
        )

        logger.info(
            "[DOC_V2_UPLOAD] SUCCESS doc_id=%s all 3 files stored",
            doc.id,
        )

        total_bytes = html_v2_file.size + txt_v2_file.size + corrections_log_file.size
        _log_activity(
            doc, 'save_export',
            f'Save & Export completed ({total_bytes:,} bytes across 3 files)',
            detail='Files: v2 HTML, v2 TXT (for RAG), corrections log',
            actor=request.user.email,
        )

        return Response({
            'ok': True,
            'html_v2_path': html_v2_path,
            'txt_v2_path': txt_v2_path,
            'corrections_log_path': corrections_log_path,
        })

    except Exception:
        logger.exception("[DOC_V2_UPLOAD] FAILED doc_id=%s storage error", doc.id)
        return Response(
            {'error': 'Failed to store v2 files'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


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
            'message': f'V1 HTML received from n8n',
            'detail': doc.processed_html_path.split('/')[-1],
            'actor': 'n8n',
        })
    if doc.processed_report_path:
        entries.append({
            'timestamp': doc.updated_at.isoformat(),
            'type': 'file',
            'level': 'success',
            'message': f'Validation report received',
            'detail': doc.processed_report_path.split('/')[-1],
            'actor': 'n8n',
        })
    if doc.html_v2_path:
        entries.append({
            'timestamp': doc.updated_at.isoformat(),
            'type': 'file',
            'level': 'success',
            'message': 'V2 HTML saved (finalized)',
            'detail': doc.html_v2_path.split('/')[-1],
            'actor': 'user',
        })
    if doc.txt_v2_path:
        entries.append({
            'timestamp': doc.updated_at.isoformat(),
            'type': 'file',
            'level': 'success',
            'message': 'V2 TXT saved (for RAG indexing)',
            'detail': doc.txt_v2_path.split('/')[-1],
            'actor': 'user',
        })

    # Activity logs (high-level user-facing events)
    for al in doc.activity_logs.order_by('created_at'):
        # Map event types to log types for frontend display
        type_map = {
            'v1_html_received': 'file',
            'v1_html_modified': 'file',
            'version_saved': 'version',
            'version_reverted': 'version',
            'save_export': 'file',
            'pdf_generated': 'file',
            'rag_push': 'status',
            'rag_response': 'status',
            'chat_sent': 'status',
            'chat_received': 'status',
            'status_change': 'status',
            'processing_started': 'status',
            'processing_complete': 'status',
        }
        level_map = {
            'rag_push': 'success',
            'rag_response': 'success',
            'save_export': 'success',
            'pdf_generated': 'success',
            'chat_sent': 'info',
            'chat_received': 'info',
            'version_saved': 'success',
            'processing_complete': 'success',
        }
        entries.append({
            'timestamp': al.created_at.isoformat(),
            'type': type_map.get(al.event_type, 'status'),
            'level': level_map.get(al.event_type, 'info'),
            'message': al.message,
            'detail': al.detail,
            'actor': al.actor,
        })

    # Sort by timestamp
    entries.sort(key=lambda e: e['timestamp'])

    return Response({
        'document_id': doc.id,
        'document_name': doc.name,
        'current_status': doc.status,
        'entries': entries,
    })
