"""Tests for authentication endpoints."""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client as TestClient

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


class TestLogin:
    """Tests for POST /api/auth/login/."""

    def test_login_success(self, api_client, advocate_user):
        """Valid credentials return user data and set session."""
        response = api_client.post(
            '/api/auth/login/',
            data={'email': 'advocate@legalaid.test', 'password': 'Test@123456'},
            content_type='application/json',
        )
        assert response.status_code == 200
        data = response.json()
        assert data['message'] == 'Login successful'
        assert data['user']['email'] == 'advocate@legalaid.test'
        assert data['user']['full_name'] == 'Adv. Rajesh Kumar'
        assert data['user']['role'] == 'advocate'

    def test_login_invalid_password(self, api_client, advocate_user):
        """Wrong password returns 400."""
        response = api_client.post(
            '/api/auth/login/',
            data={'email': 'advocate@legalaid.test', 'password': 'WrongPassword'},
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_login_nonexistent_user(self, api_client, db):
        """Non-existent email returns 400."""
        response = api_client.post(
            '/api/auth/login/',
            data={'email': 'nobody@legalaid.test', 'password': 'Test@123456'},
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_login_missing_fields(self, api_client, db):
        """Missing fields return 400."""
        response = api_client.post(
            '/api/auth/login/',
            data={'email': 'advocate@legalaid.test'},
            content_type='application/json',
        )
        assert response.status_code == 400


class TestLogout:
    """Tests for POST /api/auth/logout/."""

    def test_logout_authenticated(self, api_client, advocate_user):
        """Authenticated user can logout."""
        api_client.login(username='advocate', password='Test@123456')
        response = api_client.post('/api/auth/logout/')
        assert response.status_code == 200
        assert response.json()['message'] == 'Logout successful'

    def test_logout_unauthenticated(self, api_client, db):
        """Unauthenticated user gets 403."""
        response = api_client.post('/api/auth/logout/')
        assert response.status_code == 403


class TestMe:
    """Tests for GET /api/auth/me/."""

    def test_me_authenticated(self, api_client, advocate_user):
        """Authenticated user gets their profile."""
        api_client.login(username='advocate', password='Test@123456')
        response = api_client.get('/api/auth/me/')
        assert response.status_code == 200
        data = response.json()
        assert data['email'] == 'advocate@legalaid.test'
        assert data['full_name'] == 'Adv. Rajesh Kumar'
        assert data['role'] == 'advocate'

    def test_me_unauthenticated(self, api_client, db):
        """Unauthenticated user gets 403."""
        response = api_client.get('/api/auth/me/')
        assert response.status_code == 403

    def test_admin_role(self, api_client, db):
        """Superuser gets admin role."""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@legalaid.test',
            password='Admin@123456',
            first_name='Admin',
            last_name='User',
        )
        api_client.login(username='admin', password='Admin@123456')
        response = api_client.get('/api/auth/me/')
        assert response.status_code == 200
        assert response.json()['role'] == 'admin'
