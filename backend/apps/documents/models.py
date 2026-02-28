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
    ]

    VALID_TRANSITIONS = {
        'uploaded': ['ready_to_process'],
        'ready_to_process': ['in_progress'],
        'in_progress': ['processed'],
        'processed': [],
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
