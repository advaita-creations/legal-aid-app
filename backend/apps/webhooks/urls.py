"""Webhook URL routing."""
from django.urls import path
from . import views

urlpatterns = [
    path('webhooks/n8n/', views.n8n_webhook_view, name='n8n-webhook'),
]
