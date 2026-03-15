"""Outbound webhook triggers to n8n.

OCR Flow: POST client_name, case_id, orig_doc to n8n webhook.
n8n returns prefix_report.txt and prefix_v1.html directly in the response.
We store these files in Supabase and mark the document as processed.
"""
import json
import logging
import os
from typing import Optional

import httpx
import requests
from django.core.files.uploadedfile import SimpleUploadedFile

logger = logging.getLogger(__name__)


def _download_from_supabase(file_path: str) -> Optional[tuple[bytes, str]]:
    """Download a file from Supabase Storage via signed URL.

    Returns:
        Tuple of (content_bytes, filename) or None on failure.
    """
    from utils.storage import get_storage_backend

    backend = get_storage_backend()
    signed_url = backend.get_url(file_path)
    if not signed_url:
        logger.error('Could not generate signed URL for %s', file_path)
        return None

    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            resp = client.get(signed_url)
        if resp.status_code != 200:
            logger.error('Supabase download failed (%s): %s', resp.status_code, resp.text[:200])
            return None
        filename = file_path.rsplit('/', 1)[-1] if '/' in file_path else file_path
        logger.info('Downloaded %s from Supabase (%d bytes)', filename, len(resp.content))
        return resp.content, filename
    except Exception:
        logger.exception('Failed to download file from Supabase: %s', file_path)
        return None


def _store_processed_file(
    content: bytes,
    content_type: str,
    document,
    suffix: str,
) -> Optional[str]:
    """Upload a processed output file to Supabase Storage and return the path."""
    from utils.storage import get_storage_backend

    relative_path = f"{document.advocate_id}/{document.case_id}/processed/{document.id}_{suffix}"
    file_obj = SimpleUploadedFile(suffix, content, content_type=content_type)
    backend = get_storage_backend()
    try:
        return backend.upload(file_obj, relative_path)
    except Exception:
        logger.exception("Failed to upload %s to storage for document %s", suffix, document.id)
        return None


def _extract_response_files(response: requests.Response, prefix: str) -> dict[str, bytes]:
    """Extract output files from n8n webhook response.

    n8n may return files as:
    1. Multipart response (each part is a file)
    2. JSON with base64-encoded file content
    3. JSON with direct file URLs
    4. Binary response (single file — the HTML)

    Returns dict mapping suffix -> bytes, e.g. {'report.txt': b'...', 'v1.html': b'...'}.
    """
    content_type = response.headers.get('Content-Type', '')
    files: dict[str, bytes] = {}

    # Case 1: JSON response with file content or URLs
    if 'application/json' in content_type:
        try:
            data = response.json()
            # Handle array response from n8n (common pattern)
            if isinstance(data, list) and len(data) > 0:
                data = data[0]

            # Look for report and html in various response shapes
            for key in ('report', 'report_txt', f'{prefix}_report', 'output_report'):
                if key in data and data[key]:
                    val = data[key]
                    if isinstance(val, str):
                        files['report.txt'] = val.encode('utf-8')
                    break

            for key in ('html', 'v1_html', f'{prefix}_v1', 'output_html'):
                if key in data and data[key]:
                    val = data[key]
                    if isinstance(val, str):
                        files['v1.html'] = val.encode('utf-8')
                    break

            # Also check nested 'files' key
            if 'files' in data and isinstance(data['files'], dict):
                for k, v in data['files'].items():
                    if 'report' in k.lower():
                        files['report.txt'] = v.encode('utf-8') if isinstance(v, str) else v
                    elif 'html' in k.lower() or 'v1' in k.lower():
                        files['v1.html'] = v.encode('utf-8') if isinstance(v, str) else v

            logger.info("Extracted %d files from JSON response: %s", len(files), list(files.keys()))
        except (json.JSONDecodeError, KeyError, TypeError):
            logger.exception("Failed to parse JSON response from n8n")

    # Case 2: HTML response (n8n returned the processed HTML directly)
    elif 'text/html' in content_type:
        files['v1.html'] = response.content
        logger.info("Got HTML response directly (%d bytes)", len(response.content))

    # Case 3: Plain text (might be report)
    elif 'text/plain' in content_type:
        files['report.txt'] = response.content
        logger.info("Got plain text response (%d bytes)", len(response.content))

    # Case 4: Binary / octet-stream — assume it's the HTML
    elif response.content and len(response.content) > 100:
        files['v1.html'] = response.content
        logger.info("Got binary response, treating as HTML (%d bytes)", len(response.content))

    return files


def notify_n8n_ready_to_process(
    document_id: int,
    document_name: str,
    file_path: str,
    case_title: str,
    advocate_email: str,
    client_name: str = '',
    case_id: Optional[int] = None,
) -> Optional[dict]:
    """Send document to n8n OCR webhook and handle returned files.

    Flow:
    1. POST client_name, case_id, and orig_doc to n8n OCR webhook
    2. n8n processes and returns prefix_report.txt + prefix_v1.html
    3. Store returned files in Supabase
    4. Update document with processed file paths

    Args:
        document_id: The document's primary key.
        document_name: Human-readable document name.
        file_path: Storage path for the file.
        case_title: Title of the associated case.
        advocate_email: Email of the advocate who owns the document.
        client_name: Full name of the client (for n8n).
        case_id: The case primary key.

    Returns:
        Dict with processing results, or None on failure.
    """
    url = os.environ.get('N8N_OUTBOUND_WEBHOOK_URL', '')
    secret = os.environ.get('N8N_WEBHOOK_SECRET', '')

    if not url:
        logger.info('N8N_OUTBOUND_WEBHOOK_URL not configured; skipping outbound webhook.')
        return None

    file_data = _download_from_supabase(file_path)

    # Build prefix from document name (for n8n file naming)
    prefix = os.path.splitext(document_name)[0].replace(' ', '_')

    form_data = {
        'document_id': str(document_id),
        'document_name': document_name,
        'client_name': client_name,
        'case_id': str(case_id) if case_id else '',
        'case_title': case_title,
        'advocate_email': advocate_email,
        'callback_url': os.environ.get('N8N_CALLBACK_URL', ''),
    }

    headers = {}
    if secret:
        headers['X-Webhook-Secret'] = secret

    try:
        if file_data:
            content, filename = file_data
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
            mime = {
                'pdf': 'application/pdf',
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
            }.get(ext, 'application/octet-stream')
            files = {'orig_doc': (filename, content, mime)}
            logger.info(
                'Sending OCR request to n8n for doc %s (client=%s, case=%s, file=%s, %d bytes)',
                document_id, client_name, case_id, filename, len(content),
            )
            response = requests.post(url, data=form_data, files=files, headers=headers, timeout=120)
        else:
            logger.warning('No file downloaded, sending metadata only for document %s', document_id)
            headers['Content-Type'] = 'application/json'
            response = requests.post(url, json=form_data, headers=headers, timeout=120)

        logger.info('n8n OCR response: status=%s content-type=%s size=%d',
                     response.status_code,
                     response.headers.get('Content-Type', 'unknown'),
                     len(response.content))
        response.raise_for_status()

        # Extract returned files from the response
        from apps.documents.models import Document
        document = Document.objects.get(id=document_id)

        returned_files = _extract_response_files(response, prefix)

        result = {'ok': True, 'files_stored': {}}

        if 'report.txt' in returned_files:
            path = _store_processed_file(
                returned_files['report.txt'], 'text/plain', document, f'{prefix}_report.txt',
            )
            if path:
                document.processed_report_path = path
                result['files_stored']['report'] = path

        if 'v1.html' in returned_files:
            path = _store_processed_file(
                returned_files['v1.html'], 'text/html', document, f'{prefix}_v1.html',
            )
            if path:
                document.processed_html_path = path
                result['files_stored']['html'] = path

        if result['files_stored']:
            document.save(update_fields=['processed_html_path', 'processed_report_path', 'updated_at'])
            logger.info('Stored %d processed files for document %s', len(result['files_stored']), document_id)

        return result

    except requests.RequestException as exc:
        logger.error('Failed to send n8n OCR webhook for document %s: %s', document_id, exc)
        return None
