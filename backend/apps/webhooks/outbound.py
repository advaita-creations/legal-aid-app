"""Outbound webhook triggers to n8n."""
import logging
import os
from typing import Optional

import httpx
import requests

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


def notify_n8n_ready_to_process(
    document_id: int,
    document_name: str,
    file_path: str,
    case_title: str,
    advocate_email: str,
) -> Optional[dict]:
    """Send a webhook to n8n when a document is marked ready_to_process.

    Downloads the file from Supabase and sends it as multipart/form-data
    so n8n receives the binary file directly for OCR processing.

    Args:
        document_id: The document's primary key.
        document_name: Human-readable document name.
        file_path: Storage path for the file.
        case_title: Title of the associated case.
        advocate_email: Email of the advocate who owns the document.

    Returns:
        The JSON response from n8n, or None on failure.
    """
    url = os.environ.get('N8N_OUTBOUND_WEBHOOK_URL', '')
    secret = os.environ.get('N8N_WEBHOOK_SECRET', '')

    if not url:
        logger.info('N8N_OUTBOUND_WEBHOOK_URL not configured; skipping outbound webhook.')
        return None

    # Download file from Supabase so we can send it as binary to n8n
    file_data = _download_from_supabase(file_path)

    form_data = {
        'document_id': str(document_id),
        'document_name': document_name,
        'file_path': file_path,
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
            # Determine MIME type from extension
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
            mime = {'pdf': 'application/pdf', 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg'}.get(ext, 'application/octet-stream')
            files = {'File': (filename, content, mime)}
            response = requests.post(url, data=form_data, files=files, headers=headers, timeout=30)
        else:
            logger.warning('No file downloaded, sending metadata only for document %s', document_id)
            headers['Content-Type'] = 'application/json'
            response = requests.post(url, json=form_data, headers=headers, timeout=10)

        response.raise_for_status()
        logger.info('n8n outbound webhook sent for document %s (file=%s)', document_id, bool(file_data))
        return response.json()
    except requests.RequestException as exc:
        logger.error('Failed to send n8n outbound webhook for document %s: %s', document_id, exc)
        return None
