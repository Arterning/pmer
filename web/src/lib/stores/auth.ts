import { writable } from 'svelte/store';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

function createAuthStore() {
  // 从localStorage加载初始状态
  const storedToken = localStorage.getItem('token');
  const initialState: AuthState = {
    user: null,
    token: storedToken,
    isAuthenticated: !!storedToken,
  };

  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    login: (token: string, user: User) => {
      localStorage.setItem('token', token);
      update(state => ({
        ...state,
        token,
        user,
        isAuthenticated: true,
      }));
    },
    logout: () => {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    },
    setUser: (user: User) => {
      update(state => ({
        ...state,
        user,
      }));
    },
  };
}

export const authStore = createAuthStore();
