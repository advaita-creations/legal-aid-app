import axios from 'axios';

import { supabase } from '@/lib/supabase';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

if (!apiBaseUrl) {
  throw new Error(
    'Missing VITE_API_BASE_URL environment variable. Check your .env file.',
  );
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
