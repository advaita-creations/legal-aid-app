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
