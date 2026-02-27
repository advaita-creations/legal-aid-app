# Alternative Setup — Test Auth Without Supabase Users

If Supabase user creation is failing, you can test the auth UI flow locally with mock data.

## Option 1: Wait for Supabase (Recommended)

The "Database error creating new user" is typically a temporary Supabase infrastructure issue. Try again in 5-10 minutes.

Check Supabase status: https://status.supabase.com/

## Option 2: Test UI Only (No Backend)

You can still verify the frontend UI and routing work correctly:

### 1. Create a Mock Auth Context

Create `frontend/src/features/auth/context/MockAuthContext.tsx`:

```tsx
import { createContext, useContext, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading] = useState(false);

  const mockUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'advocate@legalaid.test',
  } as User;

  const mockProfile: UserProfile = {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'Adv. Rajesh Kumar',
    email: 'advocate@legalaid.test',
    role: 'advocate',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  async function signIn(email: string, password: string) {
    // Mock validation
    if (email === 'advocate@legalaid.test' && password === 'Test@123456') {
      setIsAuthenticated(true);
    } else {
      throw new Error('Invalid credentials');
    }
  }

  async function signOut() {
    setIsAuthenticated(false);
  }

  const value = {
    user: isAuthenticated ? mockUser : null,
    profile: isAuthenticated ? mockProfile : null,
    session: null,
    isLoading,
    signIn,
    signOut,
  };

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}
```

### 2. Temporarily Switch to Mock Auth

In `frontend/src/App.tsx`, replace:
```tsx
import { AuthProvider } from '@/features/auth';
```

With:
```tsx
import { MockAuthProvider as AuthProvider } from '@/features/auth/context/MockAuthContext';
```

### 3. Test the UI

- Go to http://localhost:5173
- Login with: `advocate@legalaid.test` / `Test@123456`
- Should redirect to dashboard
- Click "Sign Out" to test logout

This lets you verify the UI flow works while waiting for Supabase.

## Option 3: Use Supabase CLI (Advanced)

If the dashboard continues to fail, you can create users via CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref fogrnfnmnqdatwnzyyla

# Create user via SQL
supabase db execute "
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'advocate@legalaid.test',
    crypt('Test@123456', gen_salt('bf')),
    now(),
    '{\"full_name\": \"Adv. Rajesh Kumar\", \"role\": \"advocate\"}'::jsonb,
    now(),
    now()
  );
"
```

---

**Recommendation:** Wait 10-15 minutes and try creating users via the Supabase Dashboard again. The database error is usually temporary.
