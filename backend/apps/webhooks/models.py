"""Models for the chat relay system."""
import uuid

from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    """Persisted chat message between an advocate and the AI assistant.

    Messages are grouped by conversation_id so the frontend can
    display threaded conversations and the backend can send
    conversation context to the n8n RAG workflow.
    """

    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    advocate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages',
    )
    conversation_id = models.UUIDField(
        default=uuid.uuid4,
        db_index=True,
        help_text='Groups messages into a conversation thread.',
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    client_id = models.IntegerField(
        null=True,
        blank=True,
        help_text='Optional client context for RAG namespace scoping.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['advocate', 'conversation_id', 'created_at']),
        ]

    def __str__(self) -> str:
        return f"[{self.role}] {self.content[:60]}"
