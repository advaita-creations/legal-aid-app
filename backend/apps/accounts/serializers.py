"""Account serializers for authentication."""
from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    """Serializer for email/password login."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Authenticate user by email and password."""
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            raise serializers.ValidationError('Must include email and password')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials')

        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for Profile model (read-only user representation)."""

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role']
        read_only_fields = ['id', 'email', 'full_name', 'role']


class AdvocateListSerializer(serializers.ModelSerializer):
    """Serializer for admin advocate list endpoint."""

    documents_count = serializers.IntegerField(read_only=True, default=0)
    clients_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'is_active', 'documents_count',
            'clients_count', 'last_login', 'created_at',
        ]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating the current user's profile."""

    class Meta:
        model = User
        fields = ['full_name', 'phone', 'avatar_url']

    def validate_full_name(self, value: str) -> str:
        """Validate full_name length."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Name must be at least 2 characters.')
        return value
