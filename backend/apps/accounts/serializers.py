"""Account serializers for authentication."""
from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                # Try with username field
                try:
                    user_obj = User.objects.get(email=email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            
            data['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_role(self, obj):
        return 'admin' if obj.is_superuser else 'advocate'


class AdvocateListSerializer(serializers.ModelSerializer):
    """Serializer for admin advocate list endpoint."""

    full_name = serializers.SerializerMethodField()
    documents_count = serializers.IntegerField(read_only=True, default=0)
    clients_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'is_active', 'documents_count',
                  'clients_count', 'last_login', 'date_joined']

    def get_full_name(self, obj) -> str:
        """Return full name or email as fallback."""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating the current user's profile."""

    full_name = serializers.CharField(required=False, max_length=255)

    class Meta:
        model = User
        fields = ['full_name', 'first_name', 'last_name', 'email']
        read_only_fields = ['email']

    def validate_full_name(self, value: str) -> str:
        """Split full_name into first_name and last_name."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Name must be at least 2 characters.')
        return value

    def update(self, instance, validated_data):
        """Handle full_name split into first/last."""
        full_name = validated_data.pop('full_name', None)
        if full_name:
            parts = full_name.strip().split(' ', 1)
            instance.first_name = parts[0]
            instance.last_name = parts[1] if len(parts) > 1 else ''
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance
