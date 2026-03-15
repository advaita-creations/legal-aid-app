"""Global search endpoint.

Searches across clients, cases, and documents with a single query.
Results are grouped by entity type and ranked by relevance.
"""
import logging

from django.db.models import Q, Value, CharField
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.clients.models import Client
from apps.cases.models import Case
from apps.documents.models import Document

logger = logging.getLogger(__name__)

MAX_RESULTS_PER_TYPE = 5


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request: Request) -> Response:
    """Search across clients, cases, and documents.

    GET /api/search/?q=<query>
    Returns grouped results: { clients: [...], cases: [...], documents: [...] }
    """
    query = request.query_params.get('q', '').strip()
    if not query or len(query) < 2:
        return Response({'clients': [], 'cases': [], 'documents': []})

    user = request.user
    is_admin = user.role == 'admin'

    # Search clients
    client_qs = Client.objects.filter(
        Q(full_name__icontains=query)
        | Q(email__icontains=query)
        | Q(phone__icontains=query)
    )
    if not is_admin:
        client_qs = client_qs.filter(advocate=user)
    clients = list(
        client_qs.values('id', 'full_name', 'email', 'phone')[:MAX_RESULTS_PER_TYPE]
    )
    for c in clients:
        c['type'] = 'client'

    # Search cases
    case_qs = Case.objects.filter(
        Q(title__icontains=query)
        | Q(case_number__icontains=query)
        | Q(description__icontains=query)
    )
    if not is_admin:
        case_qs = case_qs.filter(advocate=user)
    cases = list(
        case_qs.values('id', 'title', 'case_number', 'status')[:MAX_RESULTS_PER_TYPE]
    )
    for c in cases:
        c['type'] = 'case'

    # Search documents
    doc_qs = Document.objects.filter(
        Q(name__icontains=query)
        | Q(notes__icontains=query)
    )
    if not is_admin:
        doc_qs = doc_qs.filter(advocate=user)
    documents = list(
        doc_qs.values('id', 'name', 'file_type', 'status')[:MAX_RESULTS_PER_TYPE]
    )
    for d in documents:
        d['type'] = 'document'

    return Response({
        'clients': clients,
        'cases': cases,
        'documents': documents,
    })
