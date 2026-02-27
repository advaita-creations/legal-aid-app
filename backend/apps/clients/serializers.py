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


class ClientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating clients."""
    
    class Meta:
        model = Client
        fields = ['full_name', 'email', 'phone', 'address', 'notes']
