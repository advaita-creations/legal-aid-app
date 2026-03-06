/**
 * Auth API helpers that talk to the Django backend.
 *
 * Used in 'django' auth mode (local dev). In 'supabase' mode the
 * AuthContext calls Supabase client methods directly instead.
 */
import { apiClient } from '@/lib/api/client';
import type { UserProfile } from '@/features/auth/types';

export interface LoginResponse {
  user: UserProfile;
  message: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', { email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout/');
  },

  me: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/auth/me/');
    return response.data;
  },

  updateProfile: async (data: { full_name?: string; phone?: string }): Promise<UserProfile> => {
    const response = await apiClient.patch<UserProfile>('/auth/me/', data);
    return response.data;
  },
};
