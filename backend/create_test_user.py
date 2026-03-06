#!/usr/bin/env python
"""Create test users for local development."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create test advocate user
if not User.objects.filter(email='advocate@legalaid.test').exists():
    user = User.objects.create_user(
        email='advocate@legalaid.test',
        password='Test@123456',
        full_name='Adv. Rajesh Kumar',
        role='advocate',
    )
    print(f"Created advocate: {user.email}")
else:
    print("Advocate already exists")

# Create test admin user
if not User.objects.filter(email='admin@legalaid.test').exists():
    admin = User.objects.create_superuser(
        email='admin@legalaid.test',
        password='Admin@123456',
        full_name='Admin User',
    )
    print(f"Created admin: {admin.email}")
else:
    print("Admin already exists")
