"""Supabase JWT authentication backend for Django REST Framework.

Verifies Supabase-issued JWTs and maps them to local Profile objects.
Falls back gracefully when SUPABASE_JWT_SECRET is not configured (dev mode).

Usage:
    # In settings
    REST_FRAMEWORK = {
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "utils.supabase_auth.SupabaseJWTAuthentication",
            "rest_framework.authentication.SessionAuthentication",
        ],
    }
"""
import logging
from typing import Optional, Tuple
from uuid import UUID

import jwt
from jwt import PyJWKClient
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

logger = logging.getLogger(__name__)

User = get_user_model()


class SupabaseJWTAuthentication(BaseAuthentication):
    """Authenticate requests using Supabase-issued JWT tokens.

    Extracts the Bearer token from the Authorization header, decodes it
    using the SUPABASE_JWT_SECRET, and returns the corresponding Profile.

    If SUPABASE_JWT_SECRET is empty, this backend is a no-op (returns None)
    to allow session auth fallback in dev.
    """

    keyword = "Bearer"

    def authenticate(self, request: Request) -> Optional[Tuple[User, dict]]:
        """Authenticate the request and return (user, token_payload) or None."""
        jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", "")
        if not jwt_secret:
            return None

        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith(f"{self.keyword} "):
            return None

        token = auth_header[len(self.keyword) + 1:]
        if not token:
            return None

        payload = self._decode_token(token, jwt_secret)
        user = self._get_or_create_user(payload)
        return (user, payload)

    def authenticate_header(self, request: Request) -> str:
        """Return the WWW-Authenticate header value."""
        return self.keyword

    @staticmethod
    def _decode_token(token: str, secret: str) -> dict:
        """Decode and validate the JWT token.

        Supports both HS256 (legacy Supabase) and ES256 (new Supabase projects).
        ES256 tokens are verified via the JWKS endpoint; HS256 uses the secret directly.
        """
        try:
            header = jwt.get_unverified_header(token)
        except jwt.DecodeError:
            raise AuthenticationFailed("Invalid token.")

        alg = header.get("alg", "HS256")

        try:
            if alg == "ES256":
                supabase_url = getattr(settings, "SUPABASE_URL", "")
                if not supabase_url:
                    raise AuthenticationFailed(
                        "SUPABASE_URL required for ES256 token verification."
                    )
                jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
                jwks_client = PyJWKClient(jwks_url)
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256"],
                    audience="authenticated",
                )
            else:
                payload = jwt.decode(
                    token,
                    secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired.")
        except jwt.InvalidAudienceError:
            raise AuthenticationFailed("Invalid token audience.")
        except jwt.DecodeError:
            raise AuthenticationFailed("Invalid token.")
        except jwt.InvalidTokenError as exc:
            raise AuthenticationFailed(f"Token validation failed: {exc}")

        sub = payload.get("sub")
        if not sub:
            raise AuthenticationFailed("Token missing 'sub' claim.")

        return payload

    @staticmethod
    def _get_or_create_user(payload: dict) -> User:
        """Look up or auto-create a Profile from the JWT payload."""
        try:
            user_id = UUID(payload["sub"])
        except (ValueError, KeyError):
            raise AuthenticationFailed("Invalid 'sub' claim in token.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            email = payload.get("email", "")
            if not email:
                raise AuthenticationFailed(
                    "User not found and token has no email for auto-creation."
                )
            user_metadata = payload.get("user_metadata", {})
            user = User.objects.create(
                id=user_id,
                email=email,
                full_name=user_metadata.get("full_name", email.split("@")[0]),
                role=user_metadata.get("role", "advocate"),
            )
            user.set_unusable_password()
            user.save()
            logger.info("Auto-created profile for Supabase user %s", user_id)

        if not user.is_active:
            raise AuthenticationFailed("User account is disabled.")

        return user
