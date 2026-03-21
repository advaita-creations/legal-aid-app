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
    1. JSON with inline string content (various key names)
    2. JSON with base64-encoded binary data (n8n binary format)
    3. JSON with nested 'binary' / 'files' / 'data' keys
    4. Direct HTML response
    5. Plain text response
    6. Binary / octet-stream response

    Returns dict mapping suffix -> bytes, e.g. {'report.txt': b'...', 'v1.html': b'...'}.
    """
    import base64

    content_type = response.headers.get('Content-Type', '')
    files: dict[str, bytes] = {}

    # Log the raw response for debugging
    raw_preview = response.content[:2000].decode('utf-8', errors='replace')
    logger.info(
        "n8n response: status=%s content-type='%s' size=%d preview='%s'",
        response.status_code, content_type, len(response.content), raw_preview,
    )

    def _fetch_url(url: str, label: str) -> Optional[bytes]:
        """Download file content from a URL (e.g. Google Drive download link)."""
        try:
            with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                resp = client.get(url)
            if resp.status_code == 200 and len(resp.content) > 20:
                logger.info("Downloaded '%s' from URL (%d bytes)", label, len(resp.content))
                return resp.content
            logger.warning("URL download failed '%s': status=%s size=%d", label, resp.status_code, len(resp.content))
            return None
        except Exception:
            logger.exception("Failed to fetch URL for '%s': %s", label, url)
            return None

    def _classify_file(key: str, data_bytes: bytes) -> None:
        """Classify a file as HTML or report based on its key name or content."""
        key_lower = key.lower()
        if any(tok in key_lower for tok in ('report', 'txt', 'validation', 'summary')):
            files.setdefault('report.txt', data_bytes)
        elif any(tok in key_lower for tok in ('html', 'v1', 'output', 'processed', 'document')):
            files.setdefault('v1.html', data_bytes)
        elif data_bytes[:50].strip().startswith(b'<') or b'<html' in data_bytes[:500].lower():
            files.setdefault('v1.html', data_bytes)
        else:
            files.setdefault('report.txt', data_bytes)

    def _decode_value(val) -> bytes | None:
        """Try to decode a value as base64 or return as UTF-8 bytes."""
        if isinstance(val, bytes):
            return val
        if isinstance(val, str):
            # Try base64 first (n8n binary format)
            try:
                decoded = base64.b64decode(val, validate=True)
                if len(decoded) > 10:
                    return decoded
            except Exception:
                pass
            return val.encode('utf-8')
        return None

    def _process_dict_item(item_data: dict) -> None:
        """Process a single dict item from n8n response (may contain binary or json keys)."""

        # Pattern 0: flat file object { "data": "base64", "fileName": "...", "mimeType": "..." }
        # Produced by n8n Code node converting binary → JSON
        if 'data' in item_data and ('fileName' in item_data or 'mimeType' in item_data):
            fname = item_data.get('fileName') or item_data.get('mimeType', 'file')
            decoded = _decode_value(item_data['data'])
            if decoded and len(decoded) > 20:
                logger.info("Extracted flat file object '%s' (%d bytes)", fname, len(decoded))
                _classify_file(fname, decoded)
            return  # handled — don't double-process

        # Pattern 1: n8n binary format: { "binary": { "file": { "data": "base64", "fileName": "..." } } }
        binary_section = item_data.get('binary', {})
        if isinstance(binary_section, dict):
            for bkey, bval in binary_section.items():
                if isinstance(bval, dict) and 'data' in bval:
                    decoded = _decode_value(bval['data'])
                    if decoded:
                        fname = bval.get('fileName', bkey)
                        logger.info("Extracted binary file '%s' from key '%s' (%d bytes)", fname, bkey, len(decoded))
                        _classify_file(fname, decoded)

        # Pattern 2: n8n "json" nested key: { "json": { "html": "...", "report": "..." } }
        json_section = item_data.get('json', item_data)
        if isinstance(json_section, dict):
            # Check for flat file object inside json wrapper
            if 'data' in json_section and ('fileName' in json_section or 'mimeType' in json_section):
                fname = json_section.get('fileName') or json_section.get('mimeType', 'file')
                decoded = _decode_value(json_section['data'])
                if decoded and len(decoded) > 20:
                    logger.info("Extracted json-wrapped flat file '%s' (%d bytes)", fname, len(decoded))
                    _classify_file(fname, decoded)
                return

            # Pattern 2a: URL values — e.g. { html_download: "https://...", txt_download: "https://..." }
            # Process *_download keys first (direct download), skip *_link (viewer URLs)
            url_keys = {
                k: v for k, v in json_section.items()
                if isinstance(v, str) and v.startswith('http')
            }
            if url_keys:
                # Prefer *_download URLs; skip *_link viewer URLs
                for key, val in url_keys.items():
                    key_lower = key.lower()
                    if key_lower.endswith('_link'):
                        logger.info("Skipping viewer link key '%s'", key)
                        continue
                    logger.info("Downloading from URL key '%s': %s", key, val[:80])
                    content = _fetch_url(val, key)
                    if content:
                        _classify_file(key, content)
                return  # handled as URL response — don't double-process

            for key, val in json_section.items():
                if key == 'binary' or val is None or isinstance(val, (bool, int, float)):
                    continue
                if isinstance(val, dict):
                    inner = val.get('data') or val.get('content') or val.get('body')
                    if inner:
                        decoded = _decode_value(inner)
                        if decoded and len(decoded) > 20:
                            fname = val.get('fileName', key)
                            _classify_file(fname, decoded)
                    continue
                decoded = _decode_value(val)
                if decoded and len(decoded) > 20:
                    _classify_file(key, decoded)

        # Check nested container keys
        for container_key in ('files', 'data', 'output', 'result', 'results'):
            container = item_data.get(container_key)
            if isinstance(container, dict):
                for k, v in container.items():
                    decoded = _decode_value(v)
                    if decoded and len(decoded) > 20:
                        _classify_file(k, decoded)
            elif isinstance(container, list):
                for ci in container:
                    if isinstance(ci, dict):
                        fname = ci.get('fileName', ci.get('name', ''))
                        content = ci.get('data') or ci.get('content')
                        if content:
                            decoded = _decode_value(content)
                            if decoded:
                                _classify_file(fname or f'file_{len(files)}', decoded)

    # Case 1: JSON response
    if 'application/json' in content_type or 'json' in content_type:
        try:
            data = response.json()
            logger.info("n8n JSON response type: %s keys: %s",
                        type(data).__name__,
                        list(data.keys()) if isinstance(data, dict) else f'array[{len(data)}]' if isinstance(data, list) else 'other')

            # n8n array: process EVERY item (each may carry one binary file)
            if isinstance(data, list):
                for idx, item in enumerate(data):
                    if isinstance(item, dict):
                        logger.info("Processing array item %d: keys=%s", idx, list(item.keys()))
                        _process_dict_item(item)
            elif isinstance(data, dict):
                _process_dict_item(data)

            logger.info("Extracted %d files from JSON response: %s", len(files), list(files.keys()))
        except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as exc:
            logger.exception("Failed to parse JSON response from n8n: %s", exc)

    # Case 2: HTML response (n8n returned the processed HTML directly)
    elif 'text/html' in content_type:
        files['v1.html'] = response.content
        logger.info("Got HTML response directly (%d bytes)", len(response.content))

    # Case 3: Plain text (might be report)
    elif 'text/plain' in content_type:
        files['report.txt'] = response.content
        logger.info("Got plain text response (%d bytes)", len(response.content))

    # Case 4: Binary / octet-stream — sniff HTML vs text
    elif response.content and len(response.content) > 50:
        if b'<html' in response.content[:500].lower() or response.content[:50].strip().startswith(b'<'):
            files['v1.html'] = response.content
        else:
            files['report.txt'] = response.content
        logger.info("Got binary response (%d bytes), classified as %s", len(response.content), list(files.keys()))

    if not files:
        logger.warning(
            "No files extracted from n8n response! content-type='%s' size=%d body='%s'",
            content_type, len(response.content), raw_preview[:500],
        )

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
            try:
                doc_obj = Document.objects.get(id=document_id)
                DocumentActivityLog.objects.create(
                    document=doc_obj,
                    event_type='processing_started',
                    message=f'Document sent to n8n OCR pipeline ({len(content):,} bytes)',
                    detail=f'Client: {client_name}, Case: {case_title}',
                    actor=advocate_email,
                )
            except Exception:
                pass
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
        from apps.documents.models import Document, DocumentActivityLog, DocumentStatusHistory
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
