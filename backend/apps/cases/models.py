"""Case models for Legal Aid App."""
from django.conf import settings
from django.db import models


class Case(models.Model):
    """Case model representing a legal case linked to a client."""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('archived', 'Archived'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='cases',
    )
    advocate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cases',
    )
    title = models.CharField(max_length=255)
    case_number = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['advocate', 'case_number']
        indexes = [
            models.Index(fields=['advocate', '-created_at']),
            models.Index(fields=['client']),
        ]

    def __str__(self) -> str:
        return f"{self.case_number} — {self.title}"


class CaseEvent(models.Model):
    """Timeline event for a case.

    Tracks key milestones, status changes, document uploads,
    and manual notes added by the advocate.
    """

    EVENT_TYPE_CHOICES = [
        ('created', 'Case Created'),
        ('status_change', 'Status Changed'),
        ('document_added', 'Document Added'),
        ('document_processed', 'Document Processed'),
        ('note', 'Note Added'),
        ('hearing', 'Hearing Scheduled'),
        ('milestone', 'Milestone'),
    ]

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='events',
    )
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Extra context: old_status, new_status, document_id, etc.',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='case_events',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case', '-created_at']),
        ]

    def __str__(self) -> str:
        return f"[{self.event_type}] {self.title}"
