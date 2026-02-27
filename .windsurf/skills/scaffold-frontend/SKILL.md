---
name: scaffold-frontend
description: Scaffolds the complete React frontend project with Vite, TypeScript, TailwindCSS, shadcn/ui, and all required dependencies following the Legal Aid App project structure.
---

## What This Skill Does

Sets up the entire `frontend/` directory from scratch, ready for feature development.

## Steps

1. **Create Vite project** in `frontend/` with the `react-ts` template
2. **Install production dependencies:**
   - `@supabase/supabase-js` — Supabase client
   - `axios` — HTTP client (centralized in `src/lib/api/`)
   - `react-router-dom@6` — Client-side routing
   - `@tanstack/react-query` — Server state management
   - `react-hook-form` + `@hookform/resolvers` + `zod` — Form handling + validation
   - `react-dropzone` — File upload drag-and-drop
   - `framer-motion` — Animations
   - `lucide-react` — Icons (only icon library allowed)
   - `clsx` + `tailwind-merge` — Conditional class utility (`cn()`)

3. **Install dev dependencies:**
   - `tailwindcss` + `@tailwindcss/vite` — CSS framework
   - `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` + `jsdom` — Testing
   - `eslint` + `prettier` + `eslint-config-prettier` — Linting/formatting

4. **Initialize shadcn/ui** with default style, Slate base color, CSS variables enabled

5. **Create folder structure:**
   ```
   src/
   ├── components/
   │   ├── ui/           # shadcn/ui components
   │   └── layout/       # Sidebar, Topbar, Layout shells
   ├── features/
   │   ├── auth/
   │   ├── dashboard/
   │   ├── clients/
   │   ├── cases/
   │   ├── documents/
   │   └── admin/
   ├── hooks/
   ├── lib/
   │   ├── api/          # Axios instance + helpers
   │   ├── supabase.ts
   │   └── utils.ts      # cn() utility
   ├── types/
   ├── routes/
   ├── App.tsx
   └── main.tsx
   ```

6. **Create config files:**
   - `tailwind.config.ts`
   - `vitest.config.ts`
   - `.env.example` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`
   - `netlify.toml` with SPA redirect rule

7. **Create base utilities:**
   - `src/lib/utils.ts` — `cn()` function using `clsx` + `tailwind-merge`
   - `src/lib/supabase.ts` — Supabase client init from env vars
   - `src/lib/api/client.ts` — Axios instance with base URL and auth interceptor

## Rules to Follow

- TypeScript strict mode enabled
- Named exports only (no default exports except lazy-loaded routes)
- No `any` type — use `unknown` + type guards
- TailwindCSS utility-first — no inline styles, no CSS modules
- All UI primitives from shadcn/ui
