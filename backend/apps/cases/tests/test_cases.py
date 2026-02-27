"""Tests for case CRUD endpoints."""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client as TestClient

from apps.cases.models import Case
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
        description='Test case description',
        status='active',
    )


class TestCaseList:
    """Tests for GET /api/cases/."""

    def test_list_empty(self, authenticated_client):
        """Returns empty list when no cases."""
        response = authenticated_client.get('/api/cases/')
        assert response.status_code == 200
        assert response.json()['count'] == 0

    def test_list_with_cases(self, authenticated_client, sample_case):
        """Returns list of advocate's cases."""
        response = authenticated_client.get('/api/cases/')
        assert response.status_code == 200
        data = response.json()
        assert data['count'] == 1
        assert data['results'][0]['title'] == 'Property Dispute'
        assert data['results'][0]['case_number'] == 'PD-2026-001'
        assert data['results'][0]['client_name'] == 'Test Client'

    def test_list_isolation(self, authenticated_client, other_advocate):
        """Advocate cannot see other advocate's cases."""
        other_client = Client.objects.create(
            advocate=other_advocate,
            full_name='Other Client',
            email='other@example.com',
        )
        Case.objects.create(
            advocate=other_advocate,
            client=other_client,
            title='Other Case',
            case_number='OC-001',
        )
        response = authenticated_client.get('/api/cases/')
        assert response.status_code == 200
        assert response.json()['count'] == 0

    def test_list_unauthenticated(self, api_client, db):
        """Unauthenticated request gets 403."""
        response = api_client.get('/api/cases/')
        assert response.status_code == 403


class TestCaseCreate:
    """Tests for POST /api/cases/."""

    def test_create_success(self, authenticated_client, sample_client):
        """Creates a case with valid data."""
        response = authenticated_client.post(
            '/api/cases/',
            data={
                'client': sample_client.id,
                'title': 'New Case',
                'case_number': 'NC-001',
                'description': 'New case description',
                'status': 'active',
            },
            content_type='application/json',
        )
        assert response.status_code == 201
        data = response.json()
        assert data['title'] == 'New Case'
        assert data['case_number'] == 'NC-001'

    def test_create_missing_title(self, authenticated_client, sample_client):
        """Missing title returns 400."""
        response = authenticated_client.post(
            '/api/cases/',
            data={
                'client': sample_client.id,
                'case_number': 'NC-001',
            },
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_create_duplicate_case_number(self, authenticated_client, sample_client, sample_case):
        """Duplicate case_number for same advocate returns 400."""
        response = authenticated_client.post(
            '/api/cases/',
            data={
                'client': sample_client.id,
                'title': 'Duplicate',
                'case_number': 'PD-2026-001',
            },
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_create_auto_assigns_advocate(self, authenticated_client, sample_client, advocate_user):
        """Created case is assigned to logged-in advocate."""
        authenticated_client.post(
            '/api/cases/',
            data={
                'client': sample_client.id,
                'title': 'Auto Assign',
                'case_number': 'AA-001',
            },
            content_type='application/json',
        )
        case = Case.objects.get(case_number='AA-001')
        assert case.advocate == advocate_user


class TestCaseDetail:
    """Tests for GET/PATCH/DELETE /api/cases/:id/."""

    def test_get_detail(self, authenticated_client, sample_case):
        """Returns case detail."""
        response = authenticated_client.get(f'/api/cases/{sample_case.id}/')
        assert response.status_code == 200
        assert response.json()['title'] == 'Property Dispute'

    def test_update_case(self, authenticated_client, sample_case):
        """Updates case with PATCH."""
        response = authenticated_client.patch(
            f'/api/cases/{sample_case.id}/',
            data={'title': 'Updated Title'},
            content_type='application/json',
        )
        assert response.status_code == 200
        assert response.json()['title'] == 'Updated Title'

    def test_update_status(self, authenticated_client, sample_case):
        """Can close a case."""
        response = authenticated_client.patch(
            f'/api/cases/{sample_case.id}/',
            data={'status': 'closed'},
            content_type='application/json',
        )
        assert response.status_code == 200
        assert response.json()['status'] == 'closed'

    def test_delete_case(self, authenticated_client, sample_case):
        """Deletes case."""
        response = authenticated_client.delete(f'/api/cases/{sample_case.id}/')
        assert response.status_code == 204
        assert Case.objects.count() == 0

    def test_cannot_access_other_advocates_case(self, api_client, other_advocate, sample_case):
        """Advocate cannot access another advocate's case."""
        api_client.login(username='other', password='Test@123456')
        response = api_client.get(f'/api/cases/{sample_case.id}/')
        assert response.status_code == 404
