"""Tests for document CRUD and status transition endpoints."""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client as TestClient

from apps.cases.models import Case
from apps.clients.models import Client
from apps.documents.models import Document

User = get_user_model()


@pytest.fixture
def api_client():
    """Return a Django test client."""
    return TestClient()


@pytest.fixture
def advocate_user(db):
    """Create and return a test advocate user."""
    return User.objects.create_user(
        username='advocate',
        email='advocate@legalaid.test',
        password='Test@123456',
        first_name='Adv. Rajesh',
        last_name='Kumar',
    )


@pytest.fixture
def authenticated_client(api_client, advocate_user):
    """Return an authenticated test client."""
    api_client.login(username='advocate', password='Test@123456')
    return api_client


@pytest.fixture
def sample_client(advocate_user):
    """Create a sample client."""
    return Client.objects.create(
        advocate=advocate_user,
        full_name='Test Client',
        email='client@example.com',
    )


@pytest.fixture
def sample_case(advocate_user, sample_client):
    """Create a sample case."""
    return Case.objects.create(
        advocate=advocate_user,
        client=sample_client,
        title='Property Dispute',
        case_number='PD-2026-001',
    )


@pytest.fixture
def sample_document(advocate_user, sample_case):
    """Create a sample document."""
    return Document.objects.create(
        advocate=advocate_user,
        case=sample_case,
        name='agreement_scan.jpg',
        file_path='advocate-1/case-1/doc-1.jpg',
        file_type='image',
        file_size_bytes=2048576,
        mime_type='image/jpeg',
        status='uploaded',
    )


class TestDocumentList:
    """Tests for GET /api/documents/."""

    def test_list_empty(self, authenticated_client):
        """Returns empty list when no documents."""
        response = authenticated_client.get('/api/documents/')
        assert response.status_code == 200
        assert response.json()['count'] == 0

    def test_list_with_documents(self, authenticated_client, sample_document):
        """Returns list of advocate's documents."""
        response = authenticated_client.get('/api/documents/')
        assert response.status_code == 200
        data = response.json()
        assert data['count'] == 1
        assert data['results'][0]['name'] == 'agreement_scan.jpg'
        assert data['results'][0]['file_type'] == 'image'
        assert data['results'][0]['case_title'] == 'Property Dispute'
        assert data['results'][0]['client_name'] == 'Test Client'

    def test_list_unauthenticated(self, api_client, db):
        """Unauthenticated request gets 403."""
        response = api_client.get('/api/documents/')
        assert response.status_code == 403


class TestDocumentCreate:
    """Tests for POST /api/documents/."""

    def test_create_success(self, authenticated_client, sample_case):
        """Creates a document with valid data."""
        response = authenticated_client.post(
            '/api/documents/',
            data={
                'case': sample_case.id,
                'name': 'new_doc.pdf',
                'file_path': 'advocate-1/case-1/doc-2.pdf',
                'file_type': 'pdf',
                'file_size_bytes': 1024000,
                'mime_type': 'application/pdf',
            },
            content_type='application/json',
        )
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'new_doc.pdf'
        assert data['status'] == 'uploaded'

    def test_create_missing_case(self, authenticated_client):
        """Missing case returns 400."""
        response = authenticated_client.post(
            '/api/documents/',
            data={
                'name': 'orphan.pdf',
                'file_path': 'test/orphan.pdf',
                'file_type': 'pdf',
                'file_size_bytes': 1024,
                'mime_type': 'application/pdf',
            },
            content_type='application/json',
        )
        assert response.status_code == 400


class TestDocumentStatusTransition:
    """Tests for PATCH /api/documents/:id/status/."""

    def test_valid_transition_uploaded_to_ready(self, authenticated_client, sample_document):
        """Can transition from uploaded to ready_to_process."""
        response = authenticated_client.patch(
            f'/api/documents/{sample_document.id}/status/',
            data={'status': 'ready_to_process'},
            content_type='application/json',
        )
        assert response.status_code == 200
        assert response.json()['status'] == 'ready_to_process'

    def test_valid_transition_ready_to_in_progress(self, authenticated_client, sample_document):
        """Can transition from ready_to_process to in_progress."""
        sample_document.status = 'ready_to_process'
        sample_document.save()
        response = authenticated_client.patch(
            f'/api/documents/{sample_document.id}/status/',
            data={'status': 'in_progress'},
            content_type='application/json',
        )
        assert response.status_code == 200
        assert response.json()['status'] == 'in_progress'

    def test_valid_transition_in_progress_to_processed(self, authenticated_client, sample_document):
        """Can transition from in_progress to processed."""
        sample_document.status = 'in_progress'
        sample_document.save()
        response = authenticated_client.patch(
            f'/api/documents/{sample_document.id}/status/',
            data={'status': 'processed'},
            content_type='application/json',
        )
        assert response.status_code == 200
        assert response.json()['status'] == 'processed'

    def test_invalid_transition_uploaded_to_processed(self, authenticated_client, sample_document):
        """Cannot skip steps: uploaded → processed is invalid."""
        response = authenticated_client.patch(
            f'/api/documents/{sample_document.id}/status/',
            data={'status': 'processed'},
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_invalid_transition_backward(self, authenticated_client, sample_document):
        """Cannot go backward: ready_to_process → uploaded is invalid."""
        sample_document.status = 'ready_to_process'
        sample_document.save()
        response = authenticated_client.patch(
            f'/api/documents/{sample_document.id}/status/',
            data={'status': 'uploaded'},
            content_type='application/json',
        )
        assert response.status_code == 400


class TestDocumentDetail:
    """Tests for GET/DELETE /api/documents/:id/."""

    def test_get_detail(self, authenticated_client, sample_document):
        """Returns document detail."""
        response = authenticated_client.get(f'/api/documents/{sample_document.id}/')
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'agreement_scan.jpg'
        assert data['case_title'] == 'Property Dispute'

    def test_delete_document(self, authenticated_client, sample_document):
        """Deletes document."""
        response = authenticated_client.delete(f'/api/documents/{sample_document.id}/')
        assert response.status_code == 204
        assert Document.objects.count() == 0
