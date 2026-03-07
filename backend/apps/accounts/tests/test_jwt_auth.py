"""Tests for Supabase JWT authentication backend."""
import time
import uuid

import jwt
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from conftest import TEST_JWT_SECRET

User = get_user_model()


@pytest.mark.django_db
class TestSupabaseJWTAuthentication:
    """Tests for the SupabaseJWTAuthentication class."""

    def test_valid_jwt_authenticates(self, jwt_api_client, advocate_profile):
        """Valid JWT returns authenticated user data from /api/auth/me/."""
        response = jwt_api_client.get("/api/auth/me/")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == advocate_profile.email
        assert data["full_name"] == advocate_profile.full_name
        assert data["role"] == "advocate"

    def test_expired_jwt_returns_401(self, jwt_secret, advocate_profile, make_jwt):
        """Expired JWT returns 401."""
        token = make_jwt(
            user_id=str(advocate_profile.id),
            email=advocate_profile.email,
            exp_offset=-10,
        )
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/auth/me/")
        assert response.status_code == 401

    def test_invalid_token_returns_401(self, jwt_secret):
        """Malformed token returns 401."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-jwt")
        response = client.get("/api/auth/me/")
        assert response.status_code == 401

    def test_wrong_secret_returns_401(self, jwt_secret, advocate_profile):
        """JWT signed with wrong secret returns 401."""
        now = int(time.time())
        token = jwt.encode(
            {
                "sub": str(advocate_profile.id),
                "email": advocate_profile.email,
                "aud": "authenticated",
                "role": "authenticated",
                "iat": now,
                "exp": now + 3600,
            },
            "wrong-secret",
            algorithm="HS256",
        )
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/auth/me/")
        assert response.status_code == 401

    def test_missing_sub_claim_returns_401(self, jwt_secret):
        """JWT without 'sub' claim returns 401."""
        now = int(time.time())
        token = jwt.encode(
            {
                "email": "test@test.com",
                "aud": "authenticated",
                "iat": now,
                "exp": now + 3600,
            },
            TEST_JWT_SECRET,
            algorithm="HS256",
        )
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/auth/me/")
        assert response.status_code == 401

    def test_no_auth_header_falls_through(self, jwt_secret, db):
        """Request without Authorization header gets 401 (no backends match)."""
        client = APIClient()
        response = client.get("/api/auth/me/")
        assert response.status_code == 401

    def test_auto_creates_user_from_jwt(self, jwt_secret, make_jwt):
        """JWT for unknown user auto-creates a Profile."""
        new_id = uuid.uuid4()
        token = make_jwt(
            user_id=str(new_id),
            email="newuser@legalaid.test",
            user_metadata={"full_name": "New User", "role": "advocate"},
        )
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/auth/me/")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@legalaid.test"
        assert data["full_name"] == "New User"
        assert data["role"] == "advocate"
        assert User.objects.filter(id=new_id).exists()

    def test_inactive_user_returns_401(self, jwt_secret, advocate_profile, make_jwt):
        """JWT for inactive user returns 401."""
        advocate_profile.is_active = False
        advocate_profile.save()
        token = make_jwt(
            user_id=str(advocate_profile.id),
            email=advocate_profile.email,
        )
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/auth/me/")
        assert response.status_code == 401

    def test_jwt_skipped_when_no_secret(self, settings, advocate_profile, make_jwt):
        """When SUPABASE_JWT_SECRET is empty, JWT auth is skipped."""
        settings.SUPABASE_JWT_SECRET = ""
        token = make_jwt(user_id=str(advocate_profile.id), email=advocate_profile.email)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/auth/me/")
        assert response.status_code == 401

    def test_session_auth_still_works(self, jwt_secret, advocate_profile):
        """Session auth fallback works alongside JWT auth."""
        client = APIClient()
        client.login(email="advocate@legalaid.test", password="Test@123456")
        response = client.get("/api/auth/me/")
        assert response.status_code == 200
        assert response.json()["email"] == "advocate@legalaid.test"

    def test_jwt_auth_on_protected_endpoint(self, jwt_api_client):
        """JWT-authenticated user can access protected CRUD endpoints."""
        response = jwt_api_client.get("/api/clients/")
        assert response.status_code == 200

    def test_wrong_audience_returns_401(self, jwt_secret, advocate_profile):
        """JWT with wrong audience returns 401."""
        now = int(time.time())
        token = jwt.encode(
            {
                "sub": str(advocate_profile.id),
                "email": advocate_profile.email,
                "aud": "wrong-audience",
                "iat": now,
                "exp": now + 3600,
            },
            TEST_JWT_SECRET,
            algorithm="HS256",
        )
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/auth/me/")
        assert response.status_code == 401
