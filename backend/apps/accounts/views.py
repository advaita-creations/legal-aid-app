"""Account views for authentication."""
from django.contrib.auth import login, logout, get_user_model
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .serializers import (
    LoginSerializer, UserSerializer, ProfileUpdateSerializer, AdvocateListSerializer,
)
from apps.clients.models import Client
from apps.cases.models import Case
from apps.documents.models import Document

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        user_data = UserSerializer(user).data
        return Response({
            'user': user_data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout endpoint."""
    logout(request)
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Get current user profile."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """Update current user's profile."""
    serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    """Return dashboard statistics scoped to the authenticated advocate."""
    user = request.user
    total_clients = Client.objects.filter(advocate=user).count()
    total_cases = Case.objects.filter(advocate=user).count()
    docs_qs = Document.objects.filter(advocate=user)
    total_documents = docs_qs.count()
    documents_by_status = {
        "uploaded": docs_qs.filter(status="uploaded").count(),
        "ready_to_process": docs_qs.filter(status="ready_to_process").count(),
        "in_progress": docs_qs.filter(status="in_progress").count(),
        "processed": docs_qs.filter(status="processed").count(),
    }
    return Response({
        "total_clients": total_clients,
        "total_cases": total_cases,
        "total_documents": total_documents,
        "documents_by_status": documents_by_status,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_advocates_list(request):
    """List all advocate users with aggregate counts."""
    advocates = (
        User.objects.filter(is_superuser=False)
        .annotate(
            documents_count=Count('documents', distinct=True),
            clients_count=Count('clients', distinct=True),
        )
        .order_by('-date_joined')
    )
    search = request.query_params.get('search', '')
    if search:
        advocates = advocates.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search)
        )
    is_active = request.query_params.get('is_active')
    if is_active is not None:
        advocates = advocates.filter(is_active=is_active.lower() == 'true')
    serializer = AdvocateListSerializer(advocates, many=True)
    return Response({"count": len(serializer.data), "results": serializer.data})


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_toggle_advocate(request, pk):
    """Toggle advocate active status."""
    try:
        advocate = User.objects.get(pk=pk, is_superuser=False)
    except User.DoesNotExist:
        return Response({"error": "Advocate not found"}, status=status.HTTP_404_NOT_FOUND)
    is_active = request.data.get('is_active')
    if is_active is None:
        return Response({"error": "is_active field required"}, status=status.HTTP_400_BAD_REQUEST)
    advocate.is_active = bool(is_active)
    advocate.save(update_fields=['is_active'])
    return Response(UserSerializer(advocate).data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats_view(request):
    """Return system-wide admin statistics."""
    total_advocates = User.objects.filter(is_superuser=False).count()
    active_advocates = User.objects.filter(is_superuser=False, is_active=True).count()
    total_clients = Client.objects.count()
    total_cases = Case.objects.count()
    docs_qs = Document.objects.all()
    total_documents = docs_qs.count()
    documents_by_status = {
        "uploaded": docs_qs.filter(status="uploaded").count(),
        "ready_to_process": docs_qs.filter(status="ready_to_process").count(),
        "in_progress": docs_qs.filter(status="in_progress").count(),
        "processed": docs_qs.filter(status="processed").count(),
    }
    return Response({
        "total_advocates": total_advocates,
        "active_advocates": active_advocates,
        "total_clients": total_clients,
        "total_cases": total_cases,
        "total_documents": total_documents,
        "documents_by_status": documents_by_status,
    })
