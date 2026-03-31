import api from './client';
import { User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  getMe: () => api.get<User>('/auth/me'),
};
