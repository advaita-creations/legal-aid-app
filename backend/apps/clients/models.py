"""Client models for Legal Aid App."""
from django.conf import settings
from django.db import models


class Client(models.Model):
    """Client model representing a legal aid client."""
    
    advocate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='clients'
    )
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['advocate', '-created_at']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return self.full_name
