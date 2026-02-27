#!/usr/bin/env python
"""Create test user for local development"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create test advocate user
if not User.objects.filter(email='advocate@legalaid.test').exists():
    user = User.objects.create_user(
        username='advocate',
        email='advocate@legalaid.test',
        password='Test@123456',
        first_name='Adv. Rajesh',
        last_name='Kumar',
    )
    print(f"✅ Created user: {user.email}")
else:
    print("ℹ️  User already exists")
