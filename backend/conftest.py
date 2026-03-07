"""Root conftest with shared fixtures for all backend tests."""
import time
import uuid
from typing import Callable

import jwt
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

TEST_JWT_SECRET = "test-supabase-jwt-secret-for-testing-only"


def _make_supabase_jwt(
    user_id: str,
    email: str = "test@legalaid.test",
    role: str = "authenticated",
    user_metadata: dict = None,
    exp_offset: int = 3600,
    secret: str = TEST_JWT_SECRET,
) -> str:
    """Generate a Supabase-style JWT for testing.

    Args:
        user_id: UUID string for the 'sub' claim.
        email: Email for the token payload.
        role: Supabase role (usually 'authenticated').
        user_metadata: Optional dict for user_metadata claim.
        exp_offset: Seconds until expiration (default 1 hour).
        secret: JWT signing secret.

    Returns:
        Encoded JWT string.
    """
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "email": email,
        "aud": "authenticated",
        "role": role,
        "iat": now,
        "exp": now + exp_offset,
        "user_metadata": user_metadata or {},
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def jwt_secret(settings):
    """Set and return the test JWT secret in Django settings."""
    settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
    return TEST_JWT_SECRET


@pytest.fixture
def make_jwt() -> Callable:
    """Return a factory function for creating test JWTs."""
    return _make_supabase_jwt


@pytest.fixture
def advocate_profile(db) -> User:
    """Create and return a test advocate Profile."""
    return User.objects.create_user(
        email="advocate@legalaid.test",
        password="Test@123456",
        full_name="Adv. Rajesh Kumar",
        role="advocate",
    )


@pytest.fixture
def admin_profile(db) -> User:
    """Create and return a test admin Profile."""
    return User.objects.create_superuser(
        email="admin@legalaid.test",
        password="Admin@123456",
        full_name="Admin User",
    )


@pytest.fixture
def jwt_api_client(jwt_secret, advocate_profile, make_jwt) -> APIClient:
    """Return an APIClient pre-configured with a valid JWT for the advocate."""
    token = make_jwt(
        user_id=str(advocate_profile.id),
        email=advocate_profile.email,
    )
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client
