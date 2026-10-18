import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('trackpulse_token'),
  isAuthenticated: !!localStorage.getItem('trackpulse_token'),
  isLoading: false,

  setAuth: (user, token) => {
    localStorage.setItem('trackpulse_token', token);
    localStorage.setItem('trackpulse_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('trackpulse_token');
    localStorage.removeItem('trackpulse_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('trackpulse_token');
    const userJson = localStorage.getItem('trackpulse_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('trackpulse_token');
        localStorage.removeItem('trackpulse_user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));
