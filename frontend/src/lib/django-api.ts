import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const djangoApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
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
};
