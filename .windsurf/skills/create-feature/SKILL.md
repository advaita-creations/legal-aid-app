---
name: create-feature
description: Creates a new feature module in the frontend with the correct folder structure, barrel exports, types, and placeholder test files following Legal Aid App conventions.
---

## What This Skill Does

Generates the full folder structure for a new frontend feature module inside `frontend/src/features/<feature-name>/`.

## Steps

1. **Create the feature folder** at `frontend/src/features/<feature-name>/`

2. **Create subfolders:**
   ```
   src/features/<feature-name>/
   ├── components/     # Feature-specific React components
   ├── hooks/          # Feature-specific custom hooks
   ├── api/            # Feature-specific API call functions
   ├── types.ts        # Feature-specific TypeScript types
   └── index.ts        # Barrel export re-exporting public API
   ```

3. **Create `types.ts`** with TypeScript interfaces matching the data model from `docs/MVP_SPEC.md`

4. **Create `index.ts`** barrel export that re-exports all public components, hooks, and types

5. **Create API functions** in `api/` that use the centralized Axios client from `src/lib/api/client.ts`
   - Follow endpoint shapes from `docs/API_CONTRACT.md`

6. **Create placeholder test files** co-located with components:
   - `ComponentName.test.tsx` next to each `ComponentName.tsx`

## Checklist Before Creating

- [ ] Feature is defined in `docs/MVP_SPEC.md`
- [ ] API endpoints exist in `docs/API_CONTRACT.md`
- [ ] Types match the data model

## Rules to Follow

- Named exports only
- Barrel exports in `index.ts`
- Zod schemas for any form validation
- React Hook Form for all forms
- Tanstack Query for server state
- API calls go through `src/lib/api/` — never call Axios directly in components
- Co-located test files: `Component.test.tsx` next to `Component.tsx`
- Lucide React for icons
- shadcn/ui for all UI primitives
