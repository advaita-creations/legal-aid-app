"""Tests for dashboard stats endpoint."""
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
def other_user(db):
    return User.objects.create_user(
        username="other",
        email="other@test.com",
        password="TestPass123!",
        first_name="Other",
        last_name="Advocate",
    )


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def sample_data(user, other_user):
    """Create sample data for stats tests."""
    client1 = Client.objects.create(
        advocate=user, full_name="Client A", email="a@test.com"
    )
    client2 = Client.objects.create(
        advocate=user, full_name="Client B", email="b@test.com"
    )
    other_client = Client.objects.create(
        advocate=other_user, full_name="Other Client", email="other@test.com"
    )

    case1 = Case.objects.create(
        client=client1, advocate=user,
        title="Case 1", case_number="C-001", status="active",
    )
    case2 = Case.objects.create(
        client=client2, advocate=user,
        title="Case 2", case_number="C-002", status="closed",
    )
    Case.objects.create(
        client=other_client, advocate=other_user,
        title="Other Case", case_number="C-003", status="active",
    )

    Document.objects.create(
        case=case1, advocate=user, name="doc1.jpg",
        file_path="test/doc1.jpg", file_type="image",
        file_size_bytes=1024, mime_type="image/jpeg", status="uploaded",
    )
    Document.objects.create(
        case=case1, advocate=user, name="doc2.pdf",
        file_path="test/doc2.pdf", file_type="pdf",
        file_size_bytes=2048, mime_type="application/pdf",
        status="ready_to_process",
    )
    Document.objects.create(
        case=case2, advocate=user, name="doc3.jpg",
        file_path="test/doc3.jpg", file_type="image",
        file_size_bytes=4096, mime_type="image/jpeg", status="processed",
    )

    return {"clients": [client1, client2], "cases": [case1, case2]}


@pytest.mark.django_db
class TestDashboardStats:
    def test_unauthenticated_returns_403(self):
        client = APIClient()
        response = client.get("/api/dashboard/stats/")
        assert response.status_code == 403

    def test_returns_correct_stats(self, api_client, sample_data):
        response = api_client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        data = response.json()
        assert data["total_clients"] == 2
        assert data["total_cases"] == 2
        assert data["total_documents"] == 3
        assert data["documents_by_status"]["uploaded"] == 1
        assert data["documents_by_status"]["ready_to_process"] == 1
        assert data["documents_by_status"]["in_progress"] == 0
        assert data["documents_by_status"]["processed"] == 1

    def test_stats_scoped_to_advocate(self, api_client, sample_data):
        """Stats only include the authenticated advocate's data."""
        response = api_client.get("/api/dashboard/stats/")
        data = response.json()
        assert data["total_clients"] == 2
        assert data["total_cases"] == 2
        assert data["total_documents"] == 3

    def test_empty_stats(self, api_client):
        """New advocate with no data gets zero stats."""
        response = api_client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        data = response.json()
        assert data["total_clients"] == 0
        assert data["total_cases"] == 0
        assert data["total_documents"] == 0
        assert data["documents_by_status"]["uploaded"] == 0
