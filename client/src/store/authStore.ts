import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../api/auth.api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
  },

  register: async (email, password, name) => {
    const { data } = await authApi.register(email, password, name);
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ loading: true });
    try {
      const { data } = await authApi.getMe();
      set({ user: data, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },
}));
