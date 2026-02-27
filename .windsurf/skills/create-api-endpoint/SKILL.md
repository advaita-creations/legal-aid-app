---
name: create-api-endpoint
description: Creates a new Django REST Framework API endpoint with serializer, viewset, URL routing, permissions, and tests following the Legal Aid App API contract.
---

## What This Skill Does

Generates all backend files needed for a new API endpoint inside the appropriate Django app.

## Steps

1. **Verify the endpoint exists** in `docs/API_CONTRACT.md`
   - If not, write the spec first before any code

2. **Create/update the model** in `backend/apps/<app>/models.py`
   - Add type hints, field definitions matching `docs/MVP_SPEC.md`
   - Run `python manage.py makemigrations` and `python manage.py migrate`

3. **Create the serializer** in `backend/apps/<app>/serializers.py`
   - Request serializer (validation) + Response serializer (output)
   - Never return raw dicts from views

4. **Create the viewset** in `backend/apps/<app>/views.py`
   - Use DRF `ModelViewSet` for standard CRUD
   - Use `@action` decorator for custom endpoints
   - Attach permission classes: `IsAdvocate`, `IsAdmin`, or `IsOwner`
   - Add Google-style docstrings

5. **Register URL routes** in `backend/apps/<app>/urls.py`
   - Use DRF `DefaultRouter` for ViewSets
   - Wire into `config/urls.py` under `/api/` prefix

6. **Write tests FIRST** in `backend/apps/<app>/tests/`
   - Test happy path, validation errors, permission denials, 404s
   - Use `pytest-django` fixtures
   - Test before implementation (TDD)

7. **Add filtering** if it's a list endpoint
   - Use `django-filter` FilterSet class
   - Support search, ordering, pagination per API contract

## Reference Files

- `docs/API_CONTRACT.md` — Endpoint specification
- `docs/MVP_SPEC.md` — Data model and business rules
- `backend/utils/permissions.py` — Permission classes
- `backend/utils/pagination.py` — Standard pagination

## Rules to Follow

- Type hints on all function signatures and return types
- DRF serializers for ALL request/response data
- Permission classes — never check roles inline in views
- Pagination: page_size=20, max_page_size=100
- django-filter for queryset filtering
- API prefix: `/api/` (no version prefix for MVP)
- Human-readable error messages in standard error format
