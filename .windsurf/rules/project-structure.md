---
trigger: always_on
---

# Project Structure — Legal Aid App

This is a monorepo with frontend, backend, and Supabase config in a single repository.

```
legal-aid-app/
├── frontend/                    # React + Vite + TypeScript
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Shared/global components
│   │   │   ├── ui/              # shadcn/ui components (auto-generated)
│   │   │   └── layout/          # Sidebar, Topbar, Layout shells
│   │   ├── features/            # Feature modules
│   │   │   ├── auth/            # Login, logout, auth context
│   │   │   ├── dashboard/       # Advocate dashboard
│   │   │   ├── clients/         # Client list, detail, forms
│   │   │   ├── cases/           # Case list, detail, forms
│   │   │   ├── documents/       # Document list, detail, upload
│   │   │   └── admin/           # Admin dashboard, user management
│   │   ├── hooks/               # Shared custom hooks
│   │   ├── lib/                 # Utilities and config
│   │   │   ├── api/             # Axios instance, API helpers
│   │   │   ├── supabase.ts      # Supabase client init
│   │   │   └── utils.ts         # cn(), formatDate(), etc.
│   │   ├── types/               # Shared TypeScript types
│   │   ├── routes/              # Route definitions and guards
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── package.json
│
├── backend/                     # Django + DRF
│   ├── config/                  # Django project config
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── accounts/            # User profiles, auth middleware
│   │   ├── clients/             # Client CRUD
│   │   ├── cases/               # Case CRUD
│   │   ├── documents/           # Document CRUD, upload, status
│   │   └── webhooks/            # n8n webhook endpoint
│   ├── utils/
│   │   ├── supabase_client.py   # Supabase Python client
│   │   ├── permissions.py       # IsAdvocate, IsAdmin, IsOwner
│   │   └── pagination.py        # Custom pagination class
│   ├── tests/                   # Test root
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── supabase/                    # Supabase config
│   ├── migrations/              # SQL migration files
│   ├── seed.sql                 # Demo seed data
│   └── storage-policies.sql     # Storage bucket RLS
│
├── docs/                        # Project documentation
│   ├── MVP_SPEC.md
│   └── API_CONTRACT.md
│
├── .windsurf/                   # Windsurf IDE config
│   ├── rules/
│   └── workflows/
│
├── .env.example                 # Root env template
├── .gitignore
├── README.md
└── Makefile                     # Common dev commands
```

## Rules

- **Never create files outside this structure** without updating this document first.
- **Feature folders** are self-contained: components, hooks, API calls, types, and tests co-located.
- **Shared code** goes in `components/`, `hooks/`, `lib/`, or `types/` at the `src/` level.
- **Backend apps** map 1:1 to domain entities. Do not mix concerns across apps.
- **All environment variables** are documented in `.env.example` at both root and `backend/` levels.
