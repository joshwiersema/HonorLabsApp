import { create } from 'zustand';

const TOKEN_KEY = 'honor_labs_token';

interface AuthState {
  token: string | null;
  username: string | null;
  storeUrl: string | null;
  loading: boolean;
  setAuth: (token: string, username: string, storeUrl?: string | null) => void;
  logout: () => void;
  setStoreUrl: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  username: null,
  storeUrl: null,
  loading: true,
  setAuth: (token, username, storeUrl) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, username, storeUrl: storeUrl ?? null, loading: false });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, username: null, storeUrl: null, loading: false });
  },
  setStoreUrl: (url) => set({ storeUrl: url }),
  setLoading: (loading) => set({ loading }),
}));
