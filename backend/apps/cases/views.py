"""Case views for API."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Case, CaseEvent
from .serializers import CaseSerializer, CaseCreateSerializer


class CaseEventSerializer(serializers.ModelSerializer):
    """Serializer for case timeline events."""

    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default='System',
    )

    class Meta:
        model = CaseEvent
        fields = [
            'id', 'event_type', 'title', 'description',
            'metadata', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class CaseEventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a case event (note / milestone)."""

    class Meta:
        model = CaseEvent
        fields = ['event_type', 'title', 'description', 'metadata']


class CaseViewSet(viewsets.ModelViewSet):
    """ViewSet for Case CRUD operations."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'case_number']
    ordering_fields = ['title', 'created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return cases. Admin sees all; advocates see own."""
        qs = Case.objects.select_related('client')
        if self.request.user.role != 'admin':
            qs = qs.filter(advocate=self.request.user)
        return qs

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CaseCreateSerializer
        return CaseSerializer

    def perform_create(self, serializer):
        """Set the advocate to the current user when creating."""
        case = serializer.save(advocate=self.request.user)
        CaseEvent.objects.create(
            case=case,
            event_type='created',
            title='Case created',
            created_by=self.request.user,
        )

    @action(detail=True, methods=['get', 'post'], url_path='events')
    def events(self, request, pk=None):
        """GET: list events. POST: add a note/milestone event."""
        case = self.get_object()

        if request.method == 'GET':
            events = CaseEvent.objects.filter(case=case).select_related('created_by')
            serializer = CaseEventSerializer(events, many=True)
            return Response(serializer.data)

        serializer = CaseEventCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save(case=case, created_by=request.user)
        return Response(
            CaseEventSerializer(event).data,
            status=201,
        )
