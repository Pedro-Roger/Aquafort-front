import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTecnico: boolean;
  isOperador: boolean;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthState>({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isTecnico: false,
  isOperador: false,
  setAuth: () => {},
  clearAuth: () => {},
});

const TOKEN_KEY = 'aquafort_token';
const REFRESH_KEY = 'aquafort_refresh';
const USER_KEY = 'aquafort_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const setAuth = useCallback((accessToken: string, refresh: string, userData: User) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setRefreshToken(refresh);
    setUser(userData);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  // Keep api interceptor in sync (token refreshed externally)
  useEffect(() => {
    const handler = () => {
      const t = localStorage.getItem(TOKEN_KEY);
      setToken(t);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        user,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'ADMIN',
        isTecnico: user?.role === 'TECNICO',
        isOperador: user?.role === 'OPERADOR',
        setAuth,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
