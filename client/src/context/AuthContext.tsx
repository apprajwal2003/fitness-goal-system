import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserProfile } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  onboardingCompleted: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    onboardingCompleted: false,
  });

  const setToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState((s) => ({ ...s, user: null, profile: null, loading: false, onboardingCompleted: false }));
      return;
    }
    try {
      const data = await authApi.me();
      setState({
        user: data.user,
        profile: data.profile ?? null,
        loading: false,
        onboardingCompleted: data.profile?.onboardingCompleted ?? false,
      });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setState((s) => ({ ...s, user: null, profile: null, loading: false, onboardingCompleted: false }));
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password });
      setToken(data.token);
      await refreshUser();
      if (!data.onboardingCompleted) setState((s) => ({ ...s, onboardingCompleted: false }));
    },
    [setToken, refreshUser]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await authApi.register({ email, password, name });
      setToken(data.token);
      await refreshUser();
    },
    [setToken, refreshUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, profile: null, loading: false, onboardingCompleted: false });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
