"""Tests for storage backend abstraction."""
import os

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory

from utils.storage import LocalStorageBackend, get_storage_backend


@pytest.mark.django_db
class TestLocalStorageBackend:
    """Tests for LocalStorageBackend."""

    def test_upload_creates_file(self, settings, tmp_path):
        """Upload saves file to MEDIA_ROOT and returns relative path."""
        settings.MEDIA_ROOT = str(tmp_path)
        backend = LocalStorageBackend()
        file = SimpleUploadedFile("test.pdf", b"%PDF-1.4 content", content_type="application/pdf")

        path = backend.upload(file, "user1/case1/test.pdf")

        assert os.path.exists(os.path.join(str(tmp_path), path))
        assert "test.pdf" in path

    def test_upload_deduplicates_filename(self, settings, tmp_path):
        """Upload adds counter suffix when file already exists."""
        settings.MEDIA_ROOT = str(tmp_path)
        backend = LocalStorageBackend()

        file1 = SimpleUploadedFile("doc.pdf", b"%PDF first", content_type="application/pdf")
        path1 = backend.upload(file1, "u/c/doc.pdf")

        file2 = SimpleUploadedFile("doc.pdf", b"%PDF second", content_type="application/pdf")
        path2 = backend.upload(file2, "u/c/doc.pdf")

        assert path1 != path2
        assert os.path.exists(os.path.join(str(tmp_path), path1))
        assert os.path.exists(os.path.join(str(tmp_path), path2))

    def test_get_url_with_request(self, settings, tmp_path):
        """get_url returns absolute URI when request is provided."""
        settings.MEDIA_ROOT = str(tmp_path)
        backend = LocalStorageBackend()
        factory = RequestFactory()
        request = factory.get("/")

        url = backend.get_url("user1/case1/test.pdf", request=request)

        assert url is not None
        assert "/media/user1/case1/test.pdf" in url

    def test_get_url_without_request(self, settings, tmp_path):
        """get_url returns relative path when no request."""
        settings.MEDIA_ROOT = str(tmp_path)
        backend = LocalStorageBackend()

        url = backend.get_url("user1/case1/test.pdf")

        assert url == "/media/user1/case1/test.pdf"

    def test_get_url_empty_path(self):
        """get_url returns None for empty path."""
        backend = LocalStorageBackend()
        assert backend.get_url("") is None
        assert backend.get_url(None) is None

    def test_delete_existing_file(self, settings, tmp_path):
        """delete removes the file and returns True."""
        settings.MEDIA_ROOT = str(tmp_path)
        backend = LocalStorageBackend()

        file = SimpleUploadedFile("del.pdf", b"content", content_type="application/pdf")
        path = backend.upload(file, "u/c/del.pdf")

        result = backend.delete(path)

        assert result is True
        assert not os.path.exists(os.path.join(str(tmp_path), path))

    def test_delete_nonexistent_file(self, settings, tmp_path):
        """delete returns False for nonexistent file."""
        settings.MEDIA_ROOT = str(tmp_path)
        backend = LocalStorageBackend()

        result = backend.delete("does/not/exist.pdf")

        assert result is False


class TestGetStorageBackend:
    """Tests for get_storage_backend factory."""

    def test_default_returns_local(self, settings):
        """Default STORAGE_BACKEND returns LocalStorageBackend."""
        settings.STORAGE_BACKEND = "local"
        backend = get_storage_backend()
        assert isinstance(backend, LocalStorageBackend)

    def test_explicit_local(self, settings):
        """Explicit 'local' returns LocalStorageBackend."""
        settings.STORAGE_BACKEND = "local"
        backend = get_storage_backend()
        assert isinstance(backend, LocalStorageBackend)
