/**
 * Auth mode toggle: 'supabase' (production) or 'django' (dev fallback).
 *
 * Controlled by VITE_AUTH_MODE env var. Defaults to 'django' for local dev.
 */

export type AuthMode = 'supabase' | 'django';

export function getAuthMode(): AuthMode {
  const mode = import.meta.env.VITE_AUTH_MODE as string | undefined;
  if (mode === 'supabase') return 'supabase';
  return 'django';
}
