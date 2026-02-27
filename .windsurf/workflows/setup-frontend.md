---
description: Scaffold and run the React frontend dev server
---

# Setup Frontend

## Prerequisites

- Node.js 18+ installed
- npm or pnpm available

## Steps

1. Navigate to the frontend directory: `cd frontend`

2. Create the Vite + React + TypeScript project (if not yet scaffolded):
// turbo
```bash
npm create vite@latest . -- --template react-ts
```

3. Install core dependencies:
```bash
npm install @supabase/supabase-js axios react-router-dom@6 @tanstack/react-query react-hook-form @hookform/resolvers zod react-dropzone framer-motion lucide-react clsx tailwind-merge
```

4. Install TailwindCSS:
```bash
npm install -D tailwindcss @tailwindcss/vite
```

5. Initialize shadcn/ui:
```bash
npx shadcn@latest init
```
- Style: Default
- Base color: Slate
- CSS variables: Yes

6. Install dev dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/react @types/react-dom eslint prettier eslint-config-prettier
```

7. Create `.env` file from template:
// turbo
```bash
cp .env.example .env
```

8. Start the dev server:
```bash
npm run dev
```

The frontend should be running at `http://localhost:5173`.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_API_BASE_URL` | Backend API base URL (e.g., `http://localhost:8000/api`) |
