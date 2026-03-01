'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { getMe, type AuthUser } from '@/lib/api';

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    const u = await getMe();
    setUser(u);
  }, []);

  useEffect(() => {
    if (pathname === '/') {
      setUser(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const value: AuthState = {
    user,
    isLoading,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
