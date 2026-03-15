"""Views for the Chat relay API.

Relays chat messages to the n8n RAG workflow and persists
conversation history for the frontend.
"""
import logging
import os
import uuid
from typing import Optional

import requests
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import ChatMessage

logger = logging.getLogger(__name__)


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""

    class Meta:
        model = ChatMessage
        fields = [
            'id',
            'conversation_id',
            'role',
            'content',
            'client_id',
            'created_at',
        ]
        read_only_fields = ['id', 'role', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    """Validates an inbound chat request from the frontend."""

    message = serializers.CharField(max_length=4000)
    conversation_id = serializers.UUIDField(required=False)
    client_id = serializers.IntegerField(required=False, allow_null=True)
    case_id = serializers.IntegerField(required=False, allow_null=True)


def _resolve_client_name(client_id: int, advocate) -> Optional[str]:
    """Look up a client's full name by ID, scoped to the advocate."""
    from apps.clients.models import Client

    try:
        client = Client.objects.get(id=client_id, advocate=advocate)
        return client.full_name
    except Client.DoesNotExist:
        logger.warning("Client %s not found for advocate %s", client_id, advocate.email)
        return None


def _relay_to_n8n(
    message: str,
    advocate_email: str,
    conversation_id: str,
    client_id: Optional[int] = None,
    client_name: Optional[str] = None,
    case_id: Optional[int] = None,
) -> Optional[str]:
    """Forward the chat message to n8n.

    Routes to the RAG webhook when a client is selected (client_name provided),
    otherwise routes to the general chat webhook.

    Returns the AI response text, or None if the webhook is unavailable.
    """
    # Choose webhook: RAG (client-scoped) or general chat
    if client_name:
        webhook_url = os.environ.get('N8N_RAG_WEBHOOK_URL', '')
        if not webhook_url:
            logger.warning("N8N_RAG_WEBHOOK_URL not configured — falling back to chat webhook")
            webhook_url = os.environ.get('N8N_CHAT_WEBHOOK_URL', '')
    else:
        webhook_url = os.environ.get('N8N_CHAT_WEBHOOK_URL', '')

    if not webhook_url:
        logger.warning("No n8n webhook URL configured — returning fallback response")
        return None

    secret = os.environ.get('N8N_WEBHOOK_SECRET', '')
    headers = {}
    if secret:
        headers['X-Webhook-Secret'] = secret

    payload: dict = {
        'message': message,
        'advocate_email': advocate_email,
        'conversation_id': conversation_id,
    }

    if client_name:
        payload['client_name'] = client_name
        payload['client_id'] = client_id
        if case_id:
            payload['case_id'] = case_id
        logger.info("Routing to RAG webhook for client '%s' case=%s", client_name, case_id)
    else:
        payload['client_id'] = client_id
        if case_id:
            payload['case_id'] = case_id

    try:
        resp = requests.post(webhook_url, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get('response') or data.get('message') or data.get('answer') or data.get('output', '')
    except requests.RequestException:
        logger.exception("Failed to relay chat message to n8n")
        return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_relay(request: Request) -> Response:
    """Relay a chat message to the n8n RAG workflow and return the response.

    POST /api/chat/
    {
      "message": "What are the key terms in this agreement?",
      "conversation_id": "uuid" (optional — auto-generated if omitted),
      "client_id": 123 (optional — scopes RAG to a client namespace)
    }
    """
    serializer = ChatRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    message = serializer.validated_data['message']
    conversation_id = serializer.validated_data.get('conversation_id') or uuid.uuid4()
    client_id = serializer.validated_data.get('client_id')
    case_id = serializer.validated_data.get('case_id')

    # Persist the user message
    user_msg = ChatMessage.objects.create(
        advocate=request.user,
        conversation_id=conversation_id,
        role='user',
        content=message,
        client_id=client_id,
    )

    # Resolve client name for RAG scoping
    client_name = None
    if client_id:
        client_name = _resolve_client_name(client_id, request.user)

    # Relay to n8n (RAG webhook if client selected, general chat otherwise)
    ai_response = _relay_to_n8n(
        message=message,
        advocate_email=request.user.email,
        conversation_id=str(conversation_id),
        client_id=client_id,
        client_name=client_name,
        case_id=case_id,
    )

    if ai_response is None:
        ai_response = (
            "I'm being set up and will be fully operational soon. "
            "In the meantime, you can review your documents and cases directly."
        )

    # Persist the AI response
    assistant_msg = ChatMessage.objects.create(
        advocate=request.user,
        conversation_id=conversation_id,
        role='assistant',
        content=ai_response,
        client_id=client_id,
    )

    return Response({
        'user_message': ChatMessageSerializer(user_msg).data,
        'assistant_message': ChatMessageSerializer(assistant_msg).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request: Request) -> Response:
    """Retrieve chat history for the current user.

    GET /api/chat/history/
    Query params:
      - conversation_id: filter to a specific conversation
      - limit: max messages to return (default 50)
    """
    qs = ChatMessage.objects.filter(advocate=request.user)

    conversation_id = request.query_params.get('conversation_id')
    if conversation_id:
        qs = qs.filter(conversation_id=conversation_id)

    limit = min(int(request.query_params.get('limit', 50)), 200)
    messages = qs.order_by('-created_at')[:limit]

    # Return in chronological order
    serializer = ChatMessageSerializer(reversed(list(messages)), many=True)
    return Response(serializer.data)
