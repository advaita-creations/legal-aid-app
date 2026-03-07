"""MVP: Poll hardcoded Google Drive folder for processed output files.

After a document is marked 'in_progress', a background thread downloads
the 3 output files from public Google Drive links, uploads them to
Supabase Storage, and transitions the document to 'processed'.

For MVP, the file IDs are hardcoded. Post-MVP this will be replaced by
a proper n8n callback webhook.
"""
import logging
import threading
import time
from typing import Optional

import httpx
from django.core.files.uploadedfile import SimpleUploadedFile

logger = logging.getLogger(__name__)

# Hardcoded Google Drive file IDs for MVP
DRIVE_FILES = {
    'output_html': {
        'file_id': '1PPTJ5QBmOfENw8x1STzX01LIQS-Pg6Tx',
        'suffix': 'output_final.html',
        'content_type': 'text/html',
    },
    'output_json': {
        'file_id': '14CFkoK0MQKhZrrZX69BuqAZlkSlp54Qx',
        'suffix': 'output_consolidated.json',
        'content_type': 'application/json',
    },
    'output_report': {
        'file_id': '1i3zSJQi4Dd2rq-1vt0jLVyYLJtqWh98P',
        'suffix': 'output_validation_report.txt',
        'content_type': 'text/plain',
    },
}

POLL_INTERVAL_SECONDS = 20
MAX_POLL_ATTEMPTS = 30  # 30 * 20s = 10 minutes max
# MVP: Initial delay before first check to give n8n time to start
INITIAL_DELAY_SECONDS = 20


def _download_drive_file(file_id: str, label: str) -> Optional[bytes]:
    """Download a file from a public Google Drive link."""
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            response = client.get(url)
        if response.status_code == 200 and len(response.content) > 0:
            return response.content
        logger.warning("Drive download %s: status=%s size=%s", label, response.status_code, len(response.content))
        return None
    except Exception:
        logger.exception("Failed to download %s from Drive", label)
        return None


def _store_file(content: bytes, content_type: str, document, suffix: str) -> Optional[str]:
    """Upload content to Supabase Storage and return the stored path."""
    from utils.storage import get_storage_backend

    relative_path = f"{document.advocate_id}/{document.case_id}/processed/{document.id}_{suffix}"
    file_obj = SimpleUploadedFile(suffix, content, content_type=content_type)
    backend = get_storage_backend()
    try:
        return backend.upload(file_obj, relative_path)
    except Exception:
        logger.exception("Failed to upload %s to storage for document %s", suffix, document.id)
        return None


def _poll_and_process(document_id: int) -> None:
    """Background task: download files from Drive, upload to Supabase, mark processed."""
    import django
    django.setup()
    from apps.documents.models import Document, DocumentStatusHistory

    logger.info("Drive poller started for document %s", document_id)

    for attempt in range(1, MAX_POLL_ATTEMPTS + 1):
        time.sleep(POLL_INTERVAL_SECONDS)

        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            logger.error("Document %s not found, stopping poller", document_id)
            return

        if document.status not in ('in_progress', 'ready_to_process'):
            logger.info("Document %s status is '%s', stopping poller", document_id, document.status)
            return

        logger.info("Polling attempt %d/%d for document %s", attempt, MAX_POLL_ATTEMPTS, document_id)

        # Download all 3 files
        downloaded = {}
        all_ok = True
        for key, info in DRIVE_FILES.items():
            content = _download_drive_file(info['file_id'], key)
            if content is None:
                all_ok = False
                break
            downloaded[key] = content

        if not all_ok:
            logger.info("Not all files available yet, retrying in %ds", POLL_INTERVAL_SECONDS)
            continue

        # Upload all 3 to Supabase
        paths = {}
        for key, info in DRIVE_FILES.items():
            path = _store_file(downloaded[key], info['content_type'], document, info['suffix'])
            if path:
                paths[key] = path

        if len(paths) < 3:
            logger.error("Only %d/3 files uploaded for document %s", len(paths), document_id)
            continue

        # Update document with paths and transition to processed
        document.refresh_from_db()
        if document.status not in ('in_progress', 'ready_to_process'):
            logger.info("Document %s already transitioned to '%s'", document_id, document.status)
            return

        old_status = document.status
        document.processed_html_path = paths.get('output_html', '')
        document.processed_json_path = paths.get('output_json', '')
        document.processed_report_path = paths.get('output_report', '')
        document.status = 'processed'
        document.save()

        DocumentStatusHistory.objects.create(
            document=document,
            from_status=old_status,
            to_status='processed',
            changed_by=None,
            notes='Auto-processed: files retrieved from Google Drive',
        )

        logger.info("Document %s marked as processed with 3 output files", document_id)
        return

    logger.error("Drive poller timed out for document %s after %d attempts", document_id, MAX_POLL_ATTEMPTS)


def start_drive_poller(document_id: int) -> None:
    """Start a background thread to poll Google Drive for processed files."""
    thread = threading.Thread(
        target=_poll_and_process,
        args=(document_id,),
        daemon=True,
        name=f"drive-poller-{document_id}",
    )
    thread.start()
    logger.info("Started Drive poller thread for document %s", document_id)
