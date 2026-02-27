"""URL configuration for Legal Aid App."""
from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health_check(request) -> Response:
    """Health check endpoint."""
    return Response({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.clients.urls")),
    path("api/", include("apps.cases.urls")),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.webhooks.urls")),
]
