"""Document serializers for API."""
import os
from typing import Optional

from rest_framework import serializers
from .models import Document, DocumentStatusHistory

ALLOWED_MIME_TYPES = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'application/pdf': 'pdf',
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


class DocumentStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for document status history entries."""

    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DocumentStatusHistory
        fields = [
            'id', 'from_status', 'to_status', 'changed_by',
            'changed_by_name', 'notes', 'changed_at',
        ]

    def get_changed_by_name(self, obj) -> str:
        """Return the display name of the user who made the change."""
        if obj.changed_by:
            name = f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip()
            return name or obj.changed_by.email
        return 'System'


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model."""

    case_title = serializers.CharField(source='case.title', read_only=True)
    client_name = serializers.CharField(source='case.client.full_name', read_only=True)
    client_id = serializers.IntegerField(source='case.client.id', read_only=True)
    status_history = DocumentStatusHistorySerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()

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
            'file_url',
            'file_type',
            'file_size_bytes',
            'mime_type',
            'status',
            'notes',
            'processed_output_path',
            'created_at',
            'updated_at',
            'status_history',
        ]
        read_only_fields = [
            'id', 'advocate', 'case_title', 'client_name', 'client_id',
            'file_url', 'created_at', 'updated_at', 'status_history',
        ]

    def get_file_url(self, obj) -> Optional[str]:
        """Build full URL for the uploaded file."""
        request = self.context.get('request')
        if obj.file_path and request:
            return request.build_absolute_uri(f'/media/{obj.file_path}')
        return None


class DocumentCreateSerializer(serializers.Serializer):
    """Serializer for creating documents with real file upload."""

    case = serializers.PrimaryKeyRelatedField(
        queryset=Document._meta.get_field('case').related_model.objects.all(),
    )
    name = serializers.CharField(max_length=255, required=False)
    file = serializers.FileField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_file(self, value):
        """Validate file type and size."""
        if value.content_type not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(
                f'Unsupported file type: {value.content_type}. '
                f'Allowed: {", ".join(ALLOWED_MIME_TYPES.keys())}'
            )
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f'File too large: {value.size} bytes. Maximum is 20MB.'
            )
        return value

    def create(self, validated_data):
        """Save uploaded file and create Document record."""
        from django.conf import settings

        uploaded_file = validated_data['file']
        advocate = validated_data['advocate']
        case = validated_data['case']
        mime_type = uploaded_file.content_type
        file_type = ALLOWED_MIME_TYPES[mime_type]
        name = validated_data.get('name') or os.path.splitext(uploaded_file.name)[0]

        rel_dir = f"{advocate.id}/{case.id}"
        abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
        os.makedirs(abs_dir, exist_ok=True)

        filename = uploaded_file.name
        abs_path = os.path.join(abs_dir, filename)
        counter = 1
        base, ext = os.path.splitext(filename)
        while os.path.exists(abs_path):
            filename = f"{base}_{counter}{ext}"
            abs_path = os.path.join(abs_dir, filename)
            counter += 1

        with open(abs_path, 'wb+') as dest:
            for chunk in uploaded_file.chunks():
                dest.write(chunk)

        return Document.objects.create(
            case=case,
            advocate=advocate,
            name=name,
            file_path=f"{rel_dir}/{filename}",
            file_type=file_type,
            file_size_bytes=uploaded_file.size,
            mime_type=mime_type,
            notes=validated_data.get('notes', ''),
        )


class DocumentStatusSerializer(serializers.Serializer):
    """Serializer for updating document status."""

    status = serializers.ChoiceField(choices=Document.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
