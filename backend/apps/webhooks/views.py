"""Webhook views for n8n integration."""
import os

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.documents.models import Document


@api_view(['POST'])
@permission_classes([AllowAny])
def n8n_webhook_view(request):
    """Inbound webhook from n8n for document processing results."""
    secret = request.headers.get('X-Webhook-Secret', '')
    expected = os.environ.get('N8N_WEBHOOK_SECRET', '')
    if not expected or secret != expected:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    document_id = request.data.get('document_id')
    new_status = request.data.get('status')
    if not document_id or not new_status:
        return Response(
            {"error": "document_id and status are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        return Response(
            {"error": "Document not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    output_path = request.data.get('output_file_path')
    if output_path:
        document.processed_output_path = output_path

    document.status = new_status
    document.save()

    return Response({
        "ok": True,
        "document_id": str(document.id),
        "updated_status": document.status,
    })
