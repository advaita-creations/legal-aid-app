"""Webhook views for n8n integration.

Inbound endpoint receives processing results from n8n.
Accepts files via:
  - Multipart file upload (any field name — auto-classified as HTML or report)
  - JSON body with file content (inline or base64)
  - External URLs
  - Pre-stored Supabase paths
"""
import base64
import logging
import os
from typing import Optional

import httpx
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.documents.models import Document, DocumentStatusHistory

logger = logging.getLogger(__name__)


def _classify_field(name: str) -> Optional[str]:
    """Classify a field name as 'html', 'report', or None."""
    low = name.lower()
    if any(tok in low for tok in ('html', 'v1', 'processed', 'document', 'output_html')):
        return 'html'
    if any(tok in low for tok in ('report', 'txt', 'validation', 'summary', 'output_report')):
        return 'report'
    if any(tok in low for tok in ('json', 'structured', 'output_json')):
        return 'json'
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
        logger.info("Stored processed file: %s (%s)", suffix, stored_path)
        return stored_path
    except Exception:
        logger.exception("Failed to store processed file %s for document %s", suffix, document.id)
        return None


def _store_bytes(content: bytes, content_type: str, document: Document, suffix: str) -> Optional[str]:
    """Store raw bytes as a processed file."""
    file_obj = SimpleUploadedFile(suffix, content, content_type=content_type)
    return _store_processed_file(file_obj, document, suffix)


def _modify_v1_html_for_webapp(html_content: str) -> str:
    """Modify v1 HTML to use postMessage instead of downloads for webapp integration.

    Replaces the three download() calls at the end of saveAndExport() with
    postMessage logic so v2 files are sent to the parent window instead of
    triggering browser downloads.
    """
    import re

    # The replacement code that sends files to the parent window via postMessage
    postmessage_code = (
        "  // --- Webapp integration: postMessage instead of download ---\n"
        "  if (window.parent !== window) {\n"
        "    window.parent.postMessage({\n"
        "      type: 'v2_files_ready',\n"
        "      data: {\n"
        "        htmlV2: htmlV2,\n"
        "        txtV2: txtV2,\n"
        "        corrLogTxt: corrLogTxt,\n"
        "        baseName: BASE_NAME\n"
        "      }\n"
        "    }, '*');\n"
        "    alert('Files saved! The document has been updated in the system.');\n"
        "  } else {\n"
        "    // Fallback: original download behavior when not in iframe\n"
        "    function _dl(c, f, m) {\n"
        "      var b = new Blob([c], { type: m });\n"
        "      var a = document.createElement('a');\n"
        "      a.href = URL.createObjectURL(b);\n"
        "      a.download = f;\n"
        "      document.body.appendChild(a);\n"
        "      a.click();\n"
        "      document.body.removeChild(a);\n"
        "      setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);\n"
        "    }\n"
        "    _dl(htmlV2, BASE_NAME + '_consolidated_v2.html', 'text/html');\n"
        "    _dl(txtV2, BASE_NAME + '_consolidated_v2.txt', 'text/plain');\n"
        "    _dl(corrLogTxt, BASE_NAME + '_corrections_log.txt', 'text/plain');\n"
        "  }"
    )

    # Strategy: replace the three download() calls with postMessage logic.
    # Match: download(htmlV2, ...); download(txtV2, ...); download(corrLogTxt, ...);
    pattern = (
        r'download\(htmlV2,.*?;\s*'
        r'download\(txtV2,.*?;\s*'
        r'download\(corrLogTxt,.*?;'
    )
    match = re.search(pattern, html_content, re.DOTALL)
    if match:
        html_content = (
            html_content[:match.start()] +
            postmessage_code +
            html_content[match.end():]
        )
        logger.info("_modify_v1_html_for_webapp: replaced 3 download() calls with postMessage")
    else:
        logger.warning("_modify_v1_html_for_webapp: could not find download() calls to replace")

    return html_content


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def n8n_webhook_view(request):
    """Inbound webhook from n8n for document processing results.

    Flexible: accepts files with any field name. Files are auto-classified
    as HTML, report, or JSON based on field name and content sniffing.
    """
    # Log everything for debugging
    logger.info(
        "n8n inbound webhook: method=%s content-type=%s data-keys=%s files-keys=%s",
        request.method,
        request.content_type,
        list(request.data.keys()) if hasattr(request.data, 'keys') else type(request.data).__name__,
        list(request.FILES.keys()) if request.FILES else '[]',
    )

    secret = request.headers.get('X-Webhook-Secret', '')
    expected = os.environ.get('N8N_WEBHOOK_SECRET', '')
    if expected and secret != expected:
        logger.warning("n8n webhook: secret mismatch (got '%s', expected '%s')", secret[:4], expected[:4])
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    document_id = request.data.get('document_id')
    if not document_id:
        logger.error("n8n webhook: missing document_id. Data keys: %s", list(request.data.keys()) if hasattr(request.data, 'keys') else request.data)
        return Response(
            {"error": "document_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        document = Document.objects.select_related('case').get(id=document_id)
    except Document.DoesNotExist:
        logger.error("n8n webhook: document %s not found", document_id)
        return Response(
            {"error": "Document not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    stored_count = 0
    prefix = os.path.splitext(document.name)[0].replace(' ', '_')

    # --- Strategy 1: Multipart file uploads (any field name) ---
    for field_name, file_obj in request.FILES.items():
        file_type = _classify_field(field_name) or _classify_field(file_obj.name or '')
        # Sniff content if classification failed
        if not file_type:
            content_preview = file_obj.read(500)
            file_obj.seek(0)
            if b'<html' in content_preview.lower() or content_preview.strip().startswith(b'<'):
                file_type = 'html'
            else:
                file_type = 'report'

        if file_type == 'html' and not document.processed_html_path:
            # Modify v1 HTML to use postMessage instead of downloads
            file_obj.seek(0)
            html_content = file_obj.read().decode('utf-8')
            modified_html = _modify_v1_html_for_webapp(html_content)
            modified_file = SimpleUploadedFile(
                f'{prefix}_v1.html',
                modified_html.encode('utf-8'),
                content_type='text/html',
            )
            path = _store_processed_file(modified_file, document, f'{prefix}_v1.html')
            if path:
                document.processed_html_path = path
                stored_count += 1
                logger.info("n8n webhook: modified v1 HTML for webapp integration")
        elif file_type == 'report' and not document.processed_report_path:
            path = _store_processed_file(file_obj, document, f'{prefix}_report.txt')
            if path:
                document.processed_report_path = path
                stored_count += 1
        elif file_type == 'json' and not document.processed_json_path:
            path = _store_processed_file(file_obj, document, f'{prefix}_consolidated.json')
            if path:
                document.processed_json_path = path
                stored_count += 1
        else:
            logger.info("n8n webhook: skipping file '%s' (type=%s, already stored)", field_name, file_type)

    # --- Strategy 2: JSON body with inline / base64 content ---
    for key in list(request.data.keys()):
        if key in ('document_id', 'status', 'callback_url', 'csrfmiddlewaretoken'):
            continue

        val = request.data.get(key)
        if not val or not isinstance(val, str) or len(val) < 30:
            continue

        file_type = _classify_field(key)
        if not file_type:
            continue

        # Try base64 decode
        raw_bytes: Optional[bytes] = None
        try:
            raw_bytes = base64.b64decode(val, validate=True)
            if len(raw_bytes) < 20:
                raw_bytes = None
        except Exception:
            pass

        if raw_bytes is None:
            raw_bytes = val.encode('utf-8')

        if file_type == 'html' and not document.processed_html_path:
            path = _store_bytes(raw_bytes, 'text/html', document, f'{prefix}_v1.html')
            if path:
                document.processed_html_path = path
                stored_count += 1
        elif file_type == 'report' and not document.processed_report_path:
            path = _store_bytes(raw_bytes, 'text/plain', document, f'{prefix}_report.txt')
            if path:
                document.processed_report_path = path
                stored_count += 1

    # --- Strategy 3: Pre-stored paths ---
    for suffix in ('html', 'json', 'report'):
        for key_pattern in (f'output_{suffix}_path', f'{suffix}_path', f'processed_{suffix}_path'):
            path_val = request.data.get(key_pattern)
            if path_val and isinstance(path_val, str):
                model_field = f'processed_{suffix}_path'
                if not getattr(document, model_field, None):
                    setattr(document, model_field, path_val)
                    stored_count += 1

    # --- Strategy 4: URL references ---
    for suffix in ('html', 'report'):
        for key_pattern in (f'output_{suffix}_url', f'{suffix}_url'):
            url_val = request.data.get(key_pattern)
            if url_val and isinstance(url_val, str) and url_val.startswith('http'):
                try:
                    with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                        resp = client.get(url_val)
                    if resp.status_code == 200 and len(resp.content) > 20:
                        ct = 'text/html' if suffix == 'html' else 'text/plain'
                        model_field = f'processed_{suffix}_path'
                        if not getattr(document, model_field, None):
                            path = _store_bytes(resp.content, ct, document, f'{prefix}_{suffix}.{"html" if suffix == "html" else "txt"}')
                            if path:
                                setattr(document, model_field, path)
                                stored_count += 1
                except Exception:
                    logger.exception("n8n webhook: failed to download %s from %s", suffix, url_val)

    # Update status
    new_status = request.data.get('status', 'processed')
    old_status = document.status
    document.status = new_status
    document.save()

    DocumentStatusHistory.objects.create(
        document=document,
        from_status=old_status,
        to_status=new_status,
        changed_by=None,
        notes=f'n8n callback: {stored_count} file(s) stored',
    )

    logger.info(
        "n8n webhook: document %s updated %s → %s, stored %d files (html=%s, report=%s, json=%s)",
        document.id, old_status, new_status, stored_count,
        bool(document.processed_html_path),
        bool(document.processed_report_path),
        bool(document.processed_json_path),
    )

    return Response({
        "ok": True,
        "document_id": str(document.id),
        "updated_status": document.status,
        "files_stored": stored_count,
        "processed_files": {
            "html": bool(document.processed_html_path),
            "report": bool(document.processed_report_path),
            "json": bool(document.processed_json_path),
        },
    })
