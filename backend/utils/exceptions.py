"""Custom exception handler for standardized error responses.

Error format:
    {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Human-readable message",
            "details": {"field": ["error"]}
        }
    }
"""
from typing import Any, Optional

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


ERROR_CODE_MAP = {
    status.HTTP_400_BAD_REQUEST: "VALIDATION_ERROR",
    status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
    status.HTTP_403_FORBIDDEN: "FORBIDDEN",
    status.HTTP_404_NOT_FOUND: "NOT_FOUND",
    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE: "FILE_TOO_LARGE",
    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_FILE_TYPE",
}


def custom_exception_handler(
    exc: Exception, context: Any
) -> Optional[Response]:
    """Handle DRF exceptions with a standardized error response format.

    Args:
        exc: The exception that was raised.
        context: Additional context for the exception.

    Returns:
        Response with standardized error format, or None if unhandled.
    """
    response = exception_handler(exc, context)

    if response is None:
        return None

    error_code = ERROR_CODE_MAP.get(
        response.status_code, "INTERNAL_ERROR"
    )

    if isinstance(response.data, dict) and "detail" in response.data:
        message = str(response.data["detail"])
        details = None
    elif isinstance(response.data, dict):
        message = "Validation failed."
        details = response.data
    elif isinstance(response.data, list):
        message = str(response.data[0]) if response.data else "An error occurred."
        details = None
    else:
        message = str(response.data)
        details = None

    error_response: dict[str, Any] = {
        "error": {
            "code": error_code,
            "message": message,
        }
    }

    if details:
        error_response["error"]["details"] = details

    response.data = error_response
    return response
