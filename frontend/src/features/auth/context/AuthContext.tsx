import { createContext, useContext, useEffect, useState } from 'react';

import { authApi, type User } from '@/lib/django-api';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const userData = await authApi.me();
      setUser(userData);
      setProfile({
        id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
        phone: null,
        role: userData.role,
        is_active: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const response = await authApi.login(email, password);
    setUser(response.user);
    setProfile({
      id: response.user.id,
      full_name: response.user.full_name,
      email: response.user.email,
      phone: null,
      role: response.user.role,
      is_active: true,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async function signOut() {
    await authApi.logout();
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    await checkAuth();
  }

  const value = {
    user,
    profile,
    session: null,
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
