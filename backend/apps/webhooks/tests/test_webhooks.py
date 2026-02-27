"""Tests for n8n webhook endpoint."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.clients.models import Client
from apps.cases.models import Case
from apps.documents.models import Document

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="advocate",
        email="advocate@test.com",
        password="TestPass123!",
        first_name="Test",
        last_name="Advocate",
    )


@pytest.fixture
def document(user):
    client = Client.objects.create(
        advocate=user, full_name="Client", email="c@test.com"
    )
    case = Case.objects.create(
        client=client, advocate=user,
        title="Case", case_number="C-001", status="active",
    )
    return Document.objects.create(
        case=case, advocate=user, name="doc.jpg",
        file_path="test/doc.jpg", file_type="image",
        file_size_bytes=1024, mime_type="image/jpeg",
        status="in_progress",
    )


@pytest.mark.django_db
class TestN8nWebhook:
    def test_missing_secret_returns_401(self):
        client = APIClient()
        response = client.post("/api/webhooks/n8n/", {}, format="json")
        assert response.status_code == 401

    def test_wrong_secret_returns_401(self, settings):
        settings.N8N_WEBHOOK_SECRET = "correct-secret"
        import os
        os.environ["N8N_WEBHOOK_SECRET"] = "correct-secret"
        client = APIClient()
        response = client.post(
            "/api/webhooks/n8n/", {},
            format="json",
            HTTP_X_WEBHOOK_SECRET="wrong-secret",
        )
        assert response.status_code == 401
        os.environ.pop("N8N_WEBHOOK_SECRET", None)

    def test_valid_webhook_updates_document(self, document):
        import os
        os.environ["N8N_WEBHOOK_SECRET"] = "test-secret"
        client = APIClient()
        response = client.post(
            "/api/webhooks/n8n/",
            {
                "document_id": document.id,
                "status": "processed",
                "output_file_path": "output/processed.pdf",
            },
            format="json",
            HTTP_X_WEBHOOK_SECRET="test-secret",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["updated_status"] == "processed"
        document.refresh_from_db()
        assert document.status == "processed"
        assert document.processed_output_path == "output/processed.pdf"
        os.environ.pop("N8N_WEBHOOK_SECRET", None)

    def test_missing_fields_returns_400(self):
        import os
        os.environ["N8N_WEBHOOK_SECRET"] = "test-secret"
        client = APIClient()
        response = client.post(
            "/api/webhooks/n8n/",
            {"document_id": 999},
            format="json",
            HTTP_X_WEBHOOK_SECRET="test-secret",
        )
        assert response.status_code == 400
        os.environ.pop("N8N_WEBHOOK_SECRET", None)

    def test_nonexistent_document_returns_404(self):
        import os
        os.environ["N8N_WEBHOOK_SECRET"] = "test-secret"
        client = APIClient()
        response = client.post(
            "/api/webhooks/n8n/",
            {"document_id": 99999, "status": "processed"},
            format="json",
            HTTP_X_WEBHOOK_SECRET="test-secret",
        )
        assert response.status_code == 404
        os.environ.pop("N8N_WEBHOOK_SECRET", None)
