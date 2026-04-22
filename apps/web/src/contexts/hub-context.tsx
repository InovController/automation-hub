import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { api } from '../lib/api';
import type { Execution, HubOverview } from '../lib/types';

type HubContextValue = {
  hub: HubOverview | null;
  executions: Execution[];
  search: string;
  setSearch: (value: string) => void;
  toast: string | null;
  notify: (message: string) => void;
  clearToast: () => void;
  refreshHub: () => Promise<void>;
  unreadNotifications: number;
  refreshUnreadCount: () => Promise<void>;
};

const HubContext = createContext<HubContextValue | null>(null);

export function HubProvider({ children }: PropsWithChildren) {
  const [hub, setHub] = useState<HubOverview | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await api<{ count: number }>('/notifications/unread-count');
      setUnreadNotifications(data.count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
    pollRef.current = setInterval(() => void refreshUnreadCount(), 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshUnreadCount]);

  const refreshHub = useCallback(async () => {
    const [hubData, executionsData] = await Promise.all([
      api<HubOverview>('/robots/hub'),
      api<Execution[]>('/executions'),
    ]);

    setHub(hubData);
    setExecutions(executionsData);
  }, []);

  const notify = useCallback((message: string) => setToast(message), []);
  const clearToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({ hub, executions, search, setSearch, toast, notify, clearToast, refreshHub, unreadNotifications, refreshUnreadCount }),
    [clearToast, executions, hub, notify, refreshHub, search, toast, unreadNotifications, refreshUnreadCount],
  );

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub() {
  const context = useContext(HubContext);
  if (!context) throw new Error('useHub must be used inside HubProvider');
  return context;
}
