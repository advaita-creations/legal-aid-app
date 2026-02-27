"""Client serializers for API."""
from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for Client model."""
    
    advocate_name = serializers.CharField(source='advocate.get_full_name', read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id',
            'advocate',
            'advocate_name',
            'full_name',
            'email',
            'phone',
            'address',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'advocate', 'advocate_name', 'created_at', 'updated_at']


class ClientDetailSerializer(serializers.ModelSerializer):
    """Serializer for client detail with nested cases."""

    advocate_name = serializers.CharField(source='advocate.get_full_name', read_only=True)
    cases = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'advocate', 'advocate_name', 'full_name', 'email',
            'phone', 'address', 'notes', 'cases', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'advocate', 'advocate_name', 'created_at', 'updated_at']

    def get_cases(self, obj):
        from apps.cases.serializers import CaseSerializer
        cases = obj.cases.all()
        return CaseSerializer(cases, many=True).data


class ClientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating clients."""
    
    class Meta:
        model = Client
        fields = ['full_name', 'email', 'phone', 'address', 'notes']
