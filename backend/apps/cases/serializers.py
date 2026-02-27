"""Case serializers for API."""
from rest_framework import serializers
from .models import Case


class CaseSerializer(serializers.ModelSerializer):
    """Serializer for Case model."""

    client_name = serializers.CharField(source='client.full_name', read_only=True)

    class Meta:
        model = Case
        fields = [
            'id',
            'client',
            'client_name',
            'advocate',
            'title',
            'case_number',
            'description',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'advocate', 'client_name', 'created_at', 'updated_at']


class CaseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating cases."""

    class Meta:
        model = Case
        fields = ['client', 'title', 'case_number', 'description', 'status']

    def validate_case_number(self, value: str) -> str:
        """Ensure case_number is unique per advocate."""
        request = self.context.get('request')
        if request and Case.objects.filter(
            advocate=request.user,
            case_number=value,
        ).exists():
            raise serializers.ValidationError('A case with this number already exists.')
        return value
