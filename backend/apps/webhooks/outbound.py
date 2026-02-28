"""Outbound webhook triggers to n8n."""
import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)


def notify_n8n_ready_to_process(
    document_id: int,
    document_name: str,
    file_path: str,
    case_title: str,
    advocate_email: str,
) -> Optional[dict]:
    """Send a webhook to n8n when a document is marked ready_to_process.

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

    payload = {
        'document_id': document_id,
        'document_name': document_name,
        'file_path': file_path,
        'case_title': case_title,
        'advocate_email': advocate_email,
    }

    headers = {
        'Content-Type': 'application/json',
    }
    if secret:
        headers['X-Webhook-Secret'] = secret

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        logger.info('n8n outbound webhook sent for document %s', document_id)
        return response.json()
    except requests.RequestException as exc:
        logger.error('Failed to send n8n outbound webhook for document %s: %s', document_id, exc)
        return None
