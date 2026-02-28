import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export const djangoApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

djangoApi.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'advocate' | 'admin';
}

export interface LoginResponse {
  user: User;
  message: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await djangoApi.post<LoginResponse>('/auth/login/', { email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await djangoApi.post('/auth/logout/');
  },

  me: async (): Promise<User> => {
    const response = await djangoApi.get<User>('/auth/me/');
    return response.data;
  },

  updateProfile: async (data: { full_name?: string }): Promise<User> => {
    const response = await djangoApi.patch<User>('/me/', data);
    return response.data;
  },
};
