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
            return obj.changed_by.full_name or obj.changed_by.email
        return 'System'


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model."""

    case_id = serializers.IntegerField(source='case.id', read_only=True)
    case_title = serializers.CharField(source='case.title', read_only=True)
    client_name = serializers.CharField(source='case.client.full_name', read_only=True)
    client_id = serializers.UUIDField(source='case.client.id', read_only=True)
    status_history = DocumentStatusHistorySerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()
    processed_html_url = serializers.SerializerMethodField()
    processed_json_url = serializers.SerializerMethodField()
    processed_report_url = serializers.SerializerMethodField()
    extracted_pdf_url = serializers.SerializerMethodField()
    html_v2_url = serializers.SerializerMethodField()
    txt_v2_url = serializers.SerializerMethodField()
    corrections_log_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id',
            'case',
            'case_id',
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
            'processed_html_path',
            'processed_json_path',
            'processed_report_path',
            'processed_html_url',
            'processed_json_url',
            'processed_report_url',
            'extracted_pdf_path',
            'extracted_pdf_url',
            'html_v2_path',
            'txt_v2_path',
            'corrections_log_path',
            'html_v2_url',
            'txt_v2_url',
            'corrections_log_url',
            'created_at',
            'updated_at',
            'status_history',
        ]
        read_only_fields = [
            'id', 'advocate', 'case_id', 'case_title', 'client_name', 'client_id',
            'file_url', 'processed_html_url', 'processed_json_url',
            'processed_report_url', 'extracted_pdf_url',
            'html_v2_url', 'txt_v2_url', 'corrections_log_url',
            'created_at', 'updated_at', 'status_history',
        ]

    def _get_storage_url(self, path: Optional[str]) -> Optional[str]:
        """Build a URL for a stored file via the storage backend."""
        from utils.storage import get_storage_backend

        if not path:
            return None
        backend = get_storage_backend()
        return backend.get_url(path, request=self.context.get('request'))

    def get_file_url(self, obj) -> Optional[str]:
        """Build full URL for the uploaded file via storage backend."""
        return self._get_storage_url(obj.file_path)

    def get_processed_html_url(self, obj) -> Optional[str]:
        """Build URL for the validated HTML output."""
        return self._get_storage_url(obj.processed_html_path)

    def get_processed_json_url(self, obj) -> Optional[str]:
        """Build URL for the consolidated JSON output."""
        return self._get_storage_url(obj.processed_json_path)

    def get_processed_report_url(self, obj) -> Optional[str]:
        """Build URL for the validation report."""
        return self._get_storage_url(obj.processed_report_path)

    def get_extracted_pdf_url(self, obj) -> Optional[str]:
        """Build URL for the extracted/generated PDF."""
        return self._get_storage_url(obj.extracted_pdf_path)

    def get_html_v2_url(self, obj) -> Optional[str]:
        """Build URL for the v2 HTML (finalized, clean)."""
        return self._get_storage_url(obj.html_v2_path)

    def get_txt_v2_url(self, obj) -> Optional[str]:
        """Build URL for the v2 TXT (for RAG indexing)."""
        return self._get_storage_url(obj.txt_v2_path)

    def get_corrections_log_url(self, obj) -> Optional[str]:
        """Build URL for the corrections log."""
        return self._get_storage_url(obj.corrections_log_path)


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
        """Save uploaded file via storage backend and create Document record."""
        from utils.storage import get_storage_backend

        uploaded_file = validated_data['file']
        advocate = self.context.get('advocate') or validated_data.get('advocate')
        case = validated_data['case']
        mime_type = uploaded_file.content_type
        file_type = ALLOWED_MIME_TYPES[mime_type]
        name = validated_data.get('name') or os.path.splitext(uploaded_file.name)[0]

        if not advocate:
            raise serializers.ValidationError("Advocate is required.")

        relative_path = f"{advocate.id}/{case.id}/{uploaded_file.name}"
        backend = get_storage_backend()
        stored_path = backend.upload(uploaded_file, relative_path)

        return Document.objects.create(
            case=case,
            advocate=advocate,
            name=name,
            file_path=stored_path,
            file_type=file_type,
            file_size_bytes=uploaded_file.size,
            mime_type=mime_type,
            notes=validated_data.get('notes', ''),
        )


class DocumentStatusSerializer(serializers.Serializer):
    """Serializer for updating document status."""

    status = serializers.ChoiceField(choices=Document.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
