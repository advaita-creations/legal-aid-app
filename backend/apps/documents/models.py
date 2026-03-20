"""Document models for Legal Aid App."""
from django.conf import settings
from django.db import models


class Document(models.Model):
    """Document model representing an uploaded file linked to a case."""

    FILE_TYPE_CHOICES = [
        ('image', 'Image'),
        ('pdf', 'PDF'),
    ]

    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('ready_to_process', 'Ready to Process'),
        ('in_progress', 'In Progress'),
        ('processed', 'Processed'),
        ('finalized', 'Finalized'),
    ]

    VALID_TRANSITIONS = {
        'uploaded': ['ready_to_process'],
        'ready_to_process': ['in_progress'],
        'in_progress': ['processed', 'ready_to_process'],
        'processed': ['ready_to_process', 'finalized'],
        'finalized': [],
    }

    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.CASCADE,
        related_name='documents',
    )
    advocate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',
    )
    name = models.CharField(max_length=255)
    file_path = models.TextField(help_text='Storage path for the file')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    file_size_bytes = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    notes = models.TextField(blank=True)
    processed_output_path = models.TextField(blank=True, null=True)
    processed_html_path = models.TextField(blank=True, null=True, help_text='Storage path for validated HTML output')
    processed_json_path = models.TextField(blank=True, null=True, help_text='Storage path for consolidated JSON output')
    processed_report_path = models.TextField(blank=True, null=True, help_text='Storage path for validation report')
    extracted_pdf_path = models.TextField(blank=True, null=True, help_text='Storage path for generated PDF from finalized HTML')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['advocate', '-created_at']),
            models.Index(fields=['case']),
            models.Index(fields=['status']),
        ]

    def __str__(self) -> str:
        return self.name

    def can_transition_to(self, new_status: str) -> bool:
        """Check if the document can transition to the given status."""
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])


class DocumentStatusHistory(models.Model):
    """Audit log for document status transitions."""

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='status_history',
    )
    from_status = models.CharField(max_length=20, choices=Document.STATUS_CHOICES, null=True, blank=True)
    to_status = models.CharField(max_length=20, choices=Document.STATUS_CHOICES)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='document_status_changes',
    )
    notes = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = 'Document status histories'

    def __str__(self) -> str:
        return f"{self.document.name}: {self.from_status} → {self.to_status}"


class DocumentVersion(models.Model):
    """Tracks versioned snapshots of a processed document.

    Version 1 is the raw AI output (may contain mismatches).
    Version 2+ are human-reviewed corrections.
    """

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='versions',
    )
    version_number = models.PositiveIntegerField(default=1)
    html_path = models.TextField(
        blank=True,
        help_text='Storage path for this version\'s HTML',
    )
    json_path = models.TextField(
        blank=True,
        help_text='Storage path for this version\'s JSON',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='document_versions',
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = [('document', 'version_number')]

    def __str__(self) -> str:
        return f"{self.document.name} v{self.version_number}"


class DocumentMismatch(models.Model):
    """A single mismatch detected by the AI during document processing.

    Each mismatch represents a discrepancy between the original document
    and the AI's interpretation, requiring human review.
    """

    RESOLUTION_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('edited', 'Edited'),
    ]

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='mismatches',
    )
    version = models.ForeignKey(
        DocumentVersion,
        on_delete=models.CASCADE,
        related_name='mismatches',
    )
    mismatch_id = models.CharField(
        max_length=50,
        help_text='Unique identifier within the HTML, e.g. "mismatch-1"',
    )
    field_label = models.CharField(
        max_length=255,
        blank=True,
        help_text='Human-readable label for the field, e.g. "Salutation"',
    )
    original_text = models.TextField(help_text='Text from the original document')
    suggested_text = models.TextField(help_text='AI-suggested correction')
    status = models.CharField(
        max_length=10,
        choices=RESOLUTION_CHOICES,
        default='pending',
    )
    resolved_text = models.TextField(
        blank=True,
        help_text='Final text after human decision (for edited mismatches)',
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_mismatches',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    confidence_score = models.FloatField(
        null=True,
        blank=True,
        help_text='AI confidence score 0.0-1.0',
    )

    class Meta:
        ordering = ['id']
        unique_together = [('document', 'mismatch_id')]

    def __str__(self) -> str:
        return f"{self.document.name} — {self.mismatch_id} ({self.status})"
