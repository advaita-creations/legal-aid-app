"""Storage backend abstraction for file uploads.

Supports local filesystem (dev) and Supabase Storage (prod).
Selected via STORAGE_BACKEND env var: 'local' (default) or 'supabase'.

Usage:
    from utils.storage import get_storage_backend

    backend = get_storage_backend()
    path = backend.upload(file, relative_path)
    url = backend.get_url(path, request=request)
    backend.delete(path)
"""
import logging
import os
from abc import ABC, abstractmethod
from typing import Optional

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)


class StorageBackend(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    def upload(self, file: UploadedFile, relative_path: str) -> str:
        """Upload a file and return the storage path."""

    @abstractmethod
    def get_url(self, path: str, request: Optional[object] = None) -> Optional[str]:
        """Return a URL for the stored file."""

    @abstractmethod
    def delete(self, path: str) -> bool:
        """Delete a file. Return True if successful."""


class LocalStorageBackend(StorageBackend):
    """Store files on the local filesystem under MEDIA_ROOT."""

    def upload(self, file: UploadedFile, relative_path: str) -> str:
        """Save file to local disk and return the relative path."""
        abs_dir = os.path.join(settings.MEDIA_ROOT, os.path.dirname(relative_path))
        os.makedirs(abs_dir, exist_ok=True)

        abs_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        counter = 1
        base, ext = os.path.splitext(abs_path)
        while os.path.exists(abs_path):
            abs_path = f"{base}_{counter}{ext}"
            counter += 1

        with open(abs_path, "wb+") as dest:
            for chunk in file.chunks():
                dest.write(chunk)

        return os.path.relpath(abs_path, settings.MEDIA_ROOT)

    def get_url(self, path: str, request: Optional[object] = None) -> Optional[str]:
        """Return a full URL using the request's build_absolute_uri."""
        if not path:
            return None
        if request and hasattr(request, "build_absolute_uri"):
            return request.build_absolute_uri(f"/media/{path}")
        return f"/media/{path}"

    def delete(self, path: str) -> bool:
        """Delete a file from local disk."""
        abs_path = os.path.join(settings.MEDIA_ROOT, path)
        try:
            if os.path.exists(abs_path):
                os.remove(abs_path)
                return True
        except OSError:
            logger.exception("Failed to delete local file: %s", abs_path)
        return False


class SupabaseStorageBackend(StorageBackend):
    """Store files in Supabase Storage.

    Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be configured.
    """

    BUCKET = "documents"
    SIGNED_URL_EXPIRY = 3600

    def __init__(self) -> None:
        """Initialize Supabase storage headers."""
        self._headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        }
        self._base = f"{settings.SUPABASE_URL}/storage/v1"

    def upload(self, file: UploadedFile, relative_path: str) -> str:
        """Upload file to Supabase Storage and return the storage path."""
        import httpx

        content = file.read()
        url = f"{self._base}/object/{self.BUCKET}/{relative_path}"
        headers = {
            **self._headers,
            "Content-Type": file.content_type or "application/octet-stream",
            "x-upsert": "true",
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, content=content, headers=headers)

        if response.status_code not in (200, 201):
            logger.error(f"Supabase upload failed ({response.status_code}): {response.text}")
            raise Exception(f"Storage upload failed: {response.status_code} - {response.text}")

        logger.info(f"Uploaded {relative_path} ({len(content)} bytes)")
        return relative_path

    def get_url(self, path: str, request: Optional[object] = None) -> Optional[str]:
        """Return a signed URL for the file in Supabase Storage."""
        import httpx

        if not path:
            return None
        try:
            url = f"{self._base}/object/sign/{self.BUCKET}/{path}"
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    url,
                    json={"expiresIn": self.SIGNED_URL_EXPIRY},
                    headers={**self._headers, "Content-Type": "application/json"},
                )
            if response.status_code != 200:
                logger.error(f"Signed URL failed ({response.status_code}): {response.text}")
                return None
            data = response.json()
            signed_url = data.get("signedURL") or data.get("signedUrl")
            if signed_url and signed_url.startswith("/"):
                signed_url = f"{settings.SUPABASE_URL}/storage/v1{signed_url}"
            return signed_url
        except Exception:
            logger.exception("Failed to create signed URL for: %s", path)
            return None

    def delete(self, path: str) -> bool:
        """Delete a file from Supabase Storage."""
        import httpx

        try:
            url = f"{self._base}/object/{self.BUCKET}"
            with httpx.Client(timeout=10.0) as client:
                response = client.request(
                    "DELETE",
                    url,
                    json={"prefixes": [path]},
                    headers={**self._headers, "Content-Type": "application/json"},
                )
            return response.status_code in (200, 204)
        except Exception:
            logger.exception("Failed to delete from Supabase Storage: %s", path)
            return False


def get_storage_backend() -> StorageBackend:
    """Return the configured storage backend instance."""
    backend = getattr(settings, "STORAGE_BACKEND", "local")
    if backend == "supabase":
        return SupabaseStorageBackend()
    return LocalStorageBackend()
