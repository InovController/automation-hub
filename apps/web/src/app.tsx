import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { ToastViewport } from './components/toast';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { HubProvider, useHub } from './contexts/hub-context';
import { ThemeProvider } from './contexts/theme-context';
import { AuthPage } from './pages/auth-page';
import { DashboardPage } from './pages/dashboard-page';
import { ExecutionPage } from './pages/execution-page';
import { HistoryPage } from './pages/history-page';
import { RobotDetailPage } from './pages/robot-detail-page';
import { RobotsPage } from './pages/robots-page';
import { SchedulesPage } from './pages/schedules-page';
import { SettingsPage } from './pages/settings-page';
import { TimeSavingsPage } from './pages/time-savings-page';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HubProvider>
          <BrowserRouter>
            <AppRoutes />
            <ToastViewport />
          </BrowserRouter>
        </HubProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { user, bootstrapping } = useAuth();
  const { refreshHub } = useHub();

  useEffect(() => {
    if (user) {
      void refreshHub();
    }
  }, [refreshHub, user]);

  if (bootstrapping) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Carregando sessão...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/robots" element={<RobotsPage />} />
        <Route path="/robots/:id" element={<RobotDetailPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/executions/:id" element={<ExecutionPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/time-savings" element={<TimeSavingsPage />} />
        <Route
          path="/settings"
          element={user.role === 'admin' ? <SettingsPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
