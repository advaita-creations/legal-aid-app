"""URL configuration for Chat relay API.

These endpoints relay chat messages to the n8n RAG workflow
and return AI responses to the frontend.

All endpoints are registered under /api/chat/.
"""
from django.urls import path

from . import chat_views

urlpatterns = [
    path('', chat_views.chat_relay, name='chat-relay'),
    path('history/', chat_views.chat_history, name='chat-history'),
]
