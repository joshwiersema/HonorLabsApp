import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';

export function useAuthInit() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate existing token on app load
    authApi
      .me()
      .then((res) => {
        setAuth(token, res.data.username, res.data.store_url);
      })
      .catch(() => {
        logout();
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
