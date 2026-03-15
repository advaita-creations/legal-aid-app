"""URL configuration for Document Review API (v2).

These endpoints support the Human-in-the-Loop review workflow:
  - List document versions
  - List/resolve mismatches
  - Finalize a reviewed document into a new version
  - Save edited HTML as a new version
  - Finalize and push to RAG webhook

All endpoints are registered under /api/v2/documents/.
"""
from django.urls import path

from . import views_review, views_rag

urlpatterns = [
    path('<int:pk>/versions/', views_review.document_versions, name='document-versions'),
    path('<int:pk>/mismatches/', views_review.document_mismatches, name='document-mismatches'),
    path('<int:pk>/mismatches/<int:mismatch_id>/', views_review.resolve_mismatch, name='resolve-mismatch'),
    path('<int:pk>/review-summary/', views_review.review_summary, name='review-summary'),
    path('<int:pk>/versions/finalize/', views_review.finalize_version, name='finalize-version'),
    path('<int:pk>/versions/save/', views_rag.save_version, name='save-version'),
    path('<int:pk>/versions/<int:version_id>/revert/', views_rag.revert_version, name='revert-version'),
    path('<int:pk>/finalize-rag/', views_rag.finalize_to_rag, name='finalize-rag'),
    path('<int:pk>/logs/', views_rag.processing_logs, name='processing-logs'),
]
