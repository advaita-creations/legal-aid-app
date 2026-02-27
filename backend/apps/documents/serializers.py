"""Document serializers for API."""
from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model."""

    case_title = serializers.CharField(source='case.title', read_only=True)
    client_name = serializers.CharField(source='case.client.full_name', read_only=True)
    client_id = serializers.IntegerField(source='case.client.id', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id',
            'case',
            'case_title',
            'client_id',
            'client_name',
            'advocate',
            'name',
            'file_path',
            'file_type',
            'file_size_bytes',
            'mime_type',
            'status',
            'notes',
            'processed_output_path',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'advocate', 'case_title', 'client_name', 'client_id',
            'created_at', 'updated_at',
        ]


class DocumentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating documents."""

    class Meta:
        model = Document
        fields = [
            'case', 'name', 'file_path', 'file_type',
            'file_size_bytes', 'mime_type', 'notes',
        ]


class DocumentStatusSerializer(serializers.Serializer):
    """Serializer for updating document status."""

    status = serializers.ChoiceField(choices=Document.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
