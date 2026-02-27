"""Singleton Supabase client for backend use.

Usage:
    from utils.supabase_client import get_supabase_client

    client = get_supabase_client()
    response = client.table("profiles").select("*").execute()
"""
from typing import Optional

from supabase import Client, create_client

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Get or create the Supabase client singleton.

    Returns:
        Supabase Client instance configured with service role key.

    Raises:
        ValueError: If SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.
    """
    global _client

    if _client is not None:
        return _client

    from django.conf import settings

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY

    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment."
        )

    _client = create_client(url, key)
    return _client
