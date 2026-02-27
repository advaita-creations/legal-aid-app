"""Custom pagination classes for Legal Aid App.

Usage:
    REST_FRAMEWORK = {
        "DEFAULT_PAGINATION_CLASS": "utils.pagination.StandardPagination",
    }
"""
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Standard pagination with 20 items per page, max 100."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
