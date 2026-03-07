import { createContext, useContext, useEffect, useState } from 'react';

import { getAuthMode } from '@/lib/auth-mode';
import { authApi } from '@/lib/django-api';
import type { UserProfile } from '../types';

interface AuthContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mode = getAuthMode();
    if (mode === 'supabase') {
      initSupabaseAuth();
    } else {
      initDjangoAuth();
    }
  }, []);

  async function initSupabaseAuth() {
    try {
      const { supabase } = await import('@/lib/supabase');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const userData = await authApi.me();
        setProfile(userData);
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          try {
            const userData = await authApi.me();
            setProfile(userData);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      });
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function initDjangoAuth() {
    try {
      const userData = await authApi.me();
      setProfile(userData);
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const mode = getAuthMode();
    console.log('AuthContext.signIn - mode:', mode);

    if (mode === 'supabase') {
      try {
        const { supabase } = await import('@/lib/supabase');
        console.log('Supabase client imported successfully');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('Supabase signInWithPassword response:', { data, error });
        if (error) {
          console.error('Supabase auth error:', error);
          throw error;
        }
        console.log('Supabase auth successful, fetching user profile');
        const userData = await authApi.me();
        console.log('User profile fetched:', userData);
        setProfile(userData);
      } catch (err) {
        console.error('Error in Supabase signIn:', err);
        throw err;
      }
    } else {
      const response = await authApi.login(email, password);
      setProfile(response.user);
    }
  }

  async function signOut() {
    const mode = getAuthMode();

    if (mode === 'supabase') {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
    } else {
      await authApi.logout();
    }
    setProfile(null);
  }

  async function refreshProfile() {
    try {
      const userData = await authApi.me();
      setProfile(userData);
    } catch {
      setProfile(null);
    }
  }

  const value: AuthContextType = {
    profile,
    isLoading,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
