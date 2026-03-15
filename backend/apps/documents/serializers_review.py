"""Serializers for the Document Review API (v2)."""
from rest_framework import serializers

from .models import DocumentMismatch, DocumentVersion


class DocumentVersionSerializer(serializers.ModelSerializer):
    """Read-only serializer for document versions."""

    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DocumentVersion
        fields = [
            'id',
            'document',
            'version_number',
            'html_path',
            'json_path',
            'created_by',
            'created_by_name',
            'notes',
            'created_at',
        ]
        read_only_fields = fields

    def get_created_by_name(self, obj: DocumentVersion) -> str:
        """Return the display name of the version creator."""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return 'System'


class DocumentMismatchSerializer(serializers.ModelSerializer):
    """Serializer for document mismatches with resolution state."""

    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DocumentMismatch
        fields = [
            'id',
            'document',
            'version',
            'mismatch_id',
            'field_label',
            'original_text',
            'suggested_text',
            'status',
            'resolved_text',
            'resolved_by',
            'resolved_by_name',
            'resolved_at',
            'confidence_score',
        ]
        read_only_fields = [
            'id',
            'document',
            'version',
            'mismatch_id',
            'field_label',
            'original_text',
            'suggested_text',
            'resolved_by',
            'resolved_by_name',
            'resolved_at',
            'confidence_score',
        ]

    def get_resolved_by_name(self, obj: DocumentMismatch) -> str:
        """Return the display name of the resolver."""
        if obj.resolved_by:
            return obj.resolved_by.get_full_name() or obj.resolved_by.email
        return ''


class MismatchResolutionSerializer(serializers.Serializer):
    """Validates a mismatch resolution request (accept/reject/edit)."""

    action = serializers.ChoiceField(
        choices=['accept', 'reject', 'edit'],
        help_text='Resolution action: accept, reject, or edit.',
    )
    resolved_text = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Required when action is "edit". The corrected text.',
    )

    def validate(self, attrs: dict) -> dict:
        """Ensure resolved_text is provided when action is edit."""
        if attrs['action'] == 'edit' and not attrs.get('resolved_text', '').strip():
            raise serializers.ValidationError(
                {'resolved_text': 'This field is required when action is "edit".'}
            )
        return attrs


class ReviewSummarySerializer(serializers.Serializer):
    """Summary statistics for a document's review progress."""

    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    accepted = serializers.IntegerField()
    rejected = serializers.IntegerField()
    edited = serializers.IntegerField()
    is_complete = serializers.BooleanField()
    latest_version = serializers.IntegerField()
