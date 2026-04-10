import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { api, getStoredToken, setStoredToken } from '../lib/api';
import type { Department, SessionResponse, User } from '../lib/types';

type AuthContextValue = {
  user: User | null;
  bootstrapping: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    departments: Department[];
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = getStoredToken();
      if (!token) {
        setBootstrapping(false);
        return;
      }

      try {
        const me = await api<User>('/auth/me');
        setUser(me);
      } catch {
        setStoredToken(null);
        setUser(null);
      } finally {
        setBootstrapping(false);
      }
    }

    void restoreSession();
  }, []);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const session = await api<SessionResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setStoredToken(session.token);
    setUser(session.user);
  }, []);

  const register = useCallback(async (payload: {
    name: string;
    email: string;
    password: string;
    departments: Department[];
  }) => {
    const session = await api<SessionResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setStoredToken(session.token);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, bootstrapping, login, register, logout }),
    [bootstrapping, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
