import axios from 'axios';

import { getAuthMode } from '@/lib/auth-mode';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

if (!apiBaseUrl) {
  throw new Error(
    'Missing VITE_API_BASE_URL environment variable. Check your .env file.',
  );
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const mode = getAuthMode();

  if (mode === 'supabase') {
    const { supabase } = await import('@/lib/supabase');
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } else {
    config.withCredentials = true;
    const csrfToken = getCookie('csrftoken');
    if (
      csrfToken &&
      config.method &&
      ['post', 'put', 'patch', 'delete'].includes(config.method)
    ) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const mode = getAuthMode();
      if (mode === 'supabase') {
        const { supabase } = await import('@/lib/supabase');
        await supabase.auth.signOut();
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
