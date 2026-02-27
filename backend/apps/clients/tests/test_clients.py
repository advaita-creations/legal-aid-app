"""Tests for client CRUD endpoints."""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client as TestClient

from apps.clients.models import Client

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
def other_advocate(db):
    """Create another advocate user."""
    return User.objects.create_user(
        username='other',
        email='other@legalaid.test',
        password='Test@123456',
        first_name='Other',
        last_name='Advocate',
    )


@pytest.fixture
def authenticated_client(api_client, advocate_user):
    """Return an authenticated test client."""
    api_client.login(username='advocate', password='Test@123456')
    return api_client


@pytest.fixture
def sample_client(advocate_user):
    """Create and return a sample client."""
    return Client.objects.create(
        advocate=advocate_user,
        full_name='Test Client',
        email='client@example.com',
        phone='+919876543210',
        address='123 Test Street',
        notes='Test notes',
    )


class TestClientList:
    """Tests for GET /api/clients/."""

    def test_list_empty(self, authenticated_client):
        """Returns empty list when no clients."""
        response = authenticated_client.get('/api/clients/')
        assert response.status_code == 200
        data = response.json()
        assert data['count'] == 0
        assert data['results'] == []

    def test_list_with_clients(self, authenticated_client, sample_client):
        """Returns list of advocate's clients."""
        response = authenticated_client.get('/api/clients/')
        assert response.status_code == 200
        data = response.json()
        assert data['count'] == 1
        assert len(data['results']) == 1
        assert data['results'][0]['full_name'] == 'Test Client'
        assert data['results'][0]['email'] == 'client@example.com'

    def test_list_isolation(self, authenticated_client, other_advocate):
        """Advocate cannot see other advocate's clients."""
        Client.objects.create(
            advocate=other_advocate,
            full_name='Other Client',
            email='other@example.com',
        )
        response = authenticated_client.get('/api/clients/')
        assert response.status_code == 200
        assert response.json()['count'] == 0
        assert len(response.json()['results']) == 0

    def test_list_unauthenticated(self, api_client, db):
        """Unauthenticated request gets 403."""
        response = api_client.get('/api/clients/')
        assert response.status_code == 403


class TestClientCreate:
    """Tests for POST /api/clients/."""

    def test_create_success(self, authenticated_client):
        """Creates a client with valid data."""
        response = authenticated_client.post(
            '/api/clients/',
            data={
                'full_name': 'New Client',
                'email': 'new@example.com',
                'phone': '+919876543210',
                'address': '456 New Street',
                'notes': 'New client notes',
            },
            content_type='application/json',
        )
        assert response.status_code == 201
        data = response.json()
        assert data['full_name'] == 'New Client'
        assert data['email'] == 'new@example.com'
        assert Client.objects.count() == 1

    def test_create_minimal(self, authenticated_client):
        """Creates a client with only required fields."""
        response = authenticated_client.post(
            '/api/clients/',
            data={
                'full_name': 'Minimal Client',
                'email': 'minimal@example.com',
            },
            content_type='application/json',
        )
        assert response.status_code == 201

    def test_create_missing_name(self, authenticated_client):
        """Missing full_name returns 400."""
        response = authenticated_client.post(
            '/api/clients/',
            data={'email': 'noname@example.com'},
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_create_missing_email(self, authenticated_client):
        """Missing email returns 400."""
        response = authenticated_client.post(
            '/api/clients/',
            data={'full_name': 'No Email Client'},
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_create_auto_assigns_advocate(self, authenticated_client, advocate_user):
        """Created client is automatically assigned to logged-in advocate."""
        authenticated_client.post(
            '/api/clients/',
            data={'full_name': 'Auto Assign', 'email': 'auto@example.com'},
            content_type='application/json',
        )
        client = Client.objects.first()
        assert client.advocate == advocate_user


class TestClientDetail:
    """Tests for GET/PATCH/DELETE /api/clients/:id/."""

    def test_get_detail(self, authenticated_client, sample_client):
        """Returns client detail."""
        response = authenticated_client.get(f'/api/clients/{sample_client.id}/')
        assert response.status_code == 200
        assert response.json()['full_name'] == 'Test Client'

    def test_update_client(self, authenticated_client, sample_client):
        """Updates client with PATCH."""
        response = authenticated_client.patch(
            f'/api/clients/{sample_client.id}/',
            data={'full_name': 'Updated Name'},
            content_type='application/json',
        )
        assert response.status_code == 200
        assert response.json()['full_name'] == 'Updated Name'

    def test_delete_client(self, authenticated_client, sample_client):
        """Deletes client."""
        response = authenticated_client.delete(f'/api/clients/{sample_client.id}/')
        assert response.status_code == 204
        assert Client.objects.count() == 0

    def test_cannot_access_other_advocates_client(self, api_client, other_advocate, sample_client):
        """Advocate cannot access another advocate's client."""
        api_client.login(username='other', password='Test@123456')
        response = api_client.get(f'/api/clients/{sample_client.id}/')
        assert response.status_code == 404

    def test_get_nonexistent(self, authenticated_client):
        """Returns 404 for nonexistent client."""
        response = authenticated_client.get('/api/clients/99999/')
        assert response.status_code == 404
