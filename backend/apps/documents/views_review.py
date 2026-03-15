"""Views for the Document Review API (v2).

Supports the Human-in-the-Loop review workflow:
  - List document versions
  - List mismatches for a document
  - Resolve individual mismatches (accept/reject/edit)
  - Finalize review to generate a new document version
  - Get review summary/progress
"""
import logging
from typing import Any

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Document, DocumentMismatch, DocumentVersion
from .serializers_review import (
    DocumentMismatchSerializer,
    DocumentVersionSerializer,
    MismatchResolutionSerializer,
    ReviewSummarySerializer,
)

logger = logging.getLogger(__name__)


def _get_document_for_user(pk: int, user: Any) -> Document:
    """Retrieve a document, scoped to the requesting user (or admin)."""
    qs = Document.objects.all()
    if user.role != 'admin':
        qs = qs.filter(advocate=user)
    return get_object_or_404(qs, pk=pk)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def document_versions(request: Request, pk: int) -> Response:
    """List all versions of a document.

    GET /api/v2/documents/<pk>/versions/
    """
    doc = _get_document_for_user(pk, request.user)
    versions = doc.versions.select_related('created_by').all()
    serializer = DocumentVersionSerializer(versions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def document_mismatches(request: Request, pk: int) -> Response:
    """List all mismatches for a document (latest version).

    GET /api/v2/documents/<pk>/mismatches/
    Query params:
      - status: filter by resolution status (pending, accepted, rejected, edited)
    """
    doc = _get_document_for_user(pk, request.user)
    mismatches = doc.mismatches.select_related('resolved_by').all()

    status_filter = request.query_params.get('status')
    if status_filter:
        mismatches = mismatches.filter(status=status_filter)

    serializer = DocumentMismatchSerializer(mismatches, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def resolve_mismatch(request: Request, pk: int, mismatch_id: int) -> Response:
    """Resolve a single mismatch: accept, reject, or edit.

    PATCH /api/v2/documents/<pk>/mismatches/<mismatch_id>/
    Body: { "action": "accept"|"reject"|"edit", "resolved_text": "..." }
    """
    doc = _get_document_for_user(pk, request.user)
    mismatch = get_object_or_404(
        DocumentMismatch.objects.select_related('resolved_by'),
        document=doc,
        id=mismatch_id,
    )

    serializer = MismatchResolutionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    action = serializer.validated_data['action']
    resolved_text = serializer.validated_data.get('resolved_text', '')

    action_to_status = {
        'accept': 'accepted',
        'reject': 'rejected',
        'edit': 'edited',
    }

    mismatch.status = action_to_status[action]
    mismatch.resolved_by = request.user
    mismatch.resolved_at = timezone.now()

    if action == 'accept':
        mismatch.resolved_text = mismatch.suggested_text
    elif action == 'reject':
        mismatch.resolved_text = mismatch.original_text
    elif action == 'edit':
        mismatch.resolved_text = resolved_text

    mismatch.save()

    logger.info(
        "Mismatch %s on document %s resolved as '%s' by %s",
        mismatch.mismatch_id,
        doc.id,
        action,
        request.user.email,
    )

    return Response(DocumentMismatchSerializer(mismatch).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def review_summary(request: Request, pk: int) -> Response:
    """Get review progress summary for a document.

    GET /api/v2/documents/<pk>/review-summary/
    """
    doc = _get_document_for_user(pk, request.user)

    counts = doc.mismatches.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='pending')),
        accepted=Count('id', filter=Q(status='accepted')),
        rejected=Count('id', filter=Q(status='rejected')),
        edited=Count('id', filter=Q(status='edited')),
    )

    latest_version = doc.versions.order_by('-version_number').first()

    data = {
        **counts,
        'is_complete': counts['total'] > 0 and counts['pending'] == 0,
        'latest_version': latest_version.version_number if latest_version else 0,
    }

    serializer = ReviewSummarySerializer(data)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalize_version(request: Request, pk: int) -> Response:
    """Finalize the review and create a new document version.

    POST /api/v2/documents/<pk>/versions/finalize/

    All mismatches must be resolved before finalization.
    Creates a new DocumentVersion with the resolved content.
    """
    doc = _get_document_for_user(pk, request.user)

    pending_count = doc.mismatches.filter(status='pending').count()
    if pending_count > 0:
        return Response(
            {'error': f'{pending_count} mismatch(es) still pending review.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    total_mismatches = doc.mismatches.count()
    if total_mismatches == 0:
        return Response(
            {'error': 'No mismatches found. Nothing to finalize.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    latest = doc.versions.order_by('-version_number').first()
    next_number = (latest.version_number + 1) if latest else 2

    new_version = DocumentVersion.objects.create(
        document=doc,
        version_number=next_number,
        html_path=doc.processed_html_path or '',
        json_path=doc.processed_json_path or '',
        created_by=request.user,
        notes=f'Finalized after reviewing {total_mismatches} mismatch(es).',
    )

    logger.info(
        "Document %s finalized as v%s by %s (%s mismatches resolved)",
        doc.id,
        next_number,
        request.user.email,
        total_mismatches,
    )

    return Response(
        DocumentVersionSerializer(new_version).data,
        status=status.HTTP_201_CREATED,
    )
