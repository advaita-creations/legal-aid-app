"""Case app URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'cases', views.CaseViewSet, basename='case')

urlpatterns = [
    path('', include(router.urls)),
]
