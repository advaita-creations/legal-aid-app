---
name: deploy
description: Deploys the Legal Aid App frontend to Netlify and backend to Railway or Render, with environment configuration and post-deploy verification.
---

## What This Skill Does

Handles the complete deployment pipeline for both frontend and backend.

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test` + `pytest`)
- [ ] No uncommitted changes (`git status`)
- [ ] Environment variables configured for production
- [ ] CORS origins updated for production frontend URL
- [ ] Supabase RLS policies applied
- [ ] Demo seed data loaded (if needed for demo)

## Frontend → Netlify

1. **Build the frontend:**
   ```bash
   cd frontend && npm run build
   ```

2. **Verify `netlify.toml` exists** with SPA redirect:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Set environment variables** in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` (deployed backend URL)

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

## Backend → Railway / Render

1. **Verify `Dockerfile`** in `backend/`:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   RUN python manage.py collectstatic --noinput
   EXPOSE 8000
   CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
   ```

2. **Set environment variables** on hosting platform:
   - `DJANGO_SECRET_KEY`
   - `DJANGO_DEBUG=False`
   - `DJANGO_ALLOWED_HOSTS` (deployed domain)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `DATABASE_URL`
   - `CORS_ALLOWED_ORIGINS` (Netlify frontend URL)
   - `N8N_WEBHOOK_URL` (if available)
   - `N8N_WEBHOOK_SECRET`

3. **Deploy to Railway:**
   ```bash
   railway up
   ```

   **Or Render:** Push to `main` branch — auto-deploys.

## Post-Deploy Verification

- [ ] Frontend loads at Netlify URL
- [ ] `{backend_url}/api/health/` returns 200
- [ ] Login flow works end-to-end
- [ ] CORS allows frontend origin
- [ ] File upload works (Supabase Storage)
- [ ] Document status transitions work
- [ ] Admin panel accessible for admin users

## Rollback

If deployment fails:
- **Netlify:** `netlify rollback` or redeploy previous commit
- **Railway:** `railway rollback` or redeploy via dashboard
- **Render:** Redeploy previous commit from dashboard
