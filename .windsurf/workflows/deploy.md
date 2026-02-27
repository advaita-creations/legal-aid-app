---
description: Deploy frontend to Netlify and backend to Railway or Render
---

# Deploy

## Frontend → Netlify

### First-Time Setup

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Navigate to `frontend/` and build:
// turbo
```bash
npm run build
```

4. Initialize Netlify site:
```bash
netlify init
```
- Build command: `npm run build`
- Publish directory: `dist`

5. Set environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` (your deployed backend URL)

### Deploy

```bash
netlify deploy --prod
```

### Configuration File (`frontend/netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The redirects rule enables client-side routing (React Router).

---

## Backend → Railway / Render

### Dockerfile (`backend/Dockerfile`)

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

### Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and init:
```bash
railway login
railway init
```

3. Set environment variables via Railway dashboard (all from `backend/.env.example`).

4. Deploy:
```bash
railway up
```

### Render (Alternative)

1. Create a new Web Service on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn config.wsgi:application --bind 0.0.0.0:8000`
4. Add environment variables from `backend/.env.example`
5. Deploy triggers automatically on push to `main`

---

## Supabase

Supabase is already hosted in the cloud. No deployment needed.

Ensure the following are configured in the Supabase dashboard:
- **Auth:** Email provider enabled, auto-confirm ON (for MVP)
- **Database:** Tables created via migrations in `supabase/migrations/`
- **Storage:** `documents` bucket created (private)
- **RLS:** Policies applied from `supabase/storage-policies.sql`

---

## Post-Deploy Checklist

- [ ] Frontend loads at Netlify URL
- [ ] Backend health check responds at `{backend_url}/api/health/`
- [ ] Login flow works end-to-end
- [ ] CORS allows frontend origin
- [ ] File upload works (Supabase Storage)
- [ ] Environment variables all set correctly
- [ ] Demo seed data loaded
