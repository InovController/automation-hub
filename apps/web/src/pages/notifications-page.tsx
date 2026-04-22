import { Bell, CheckCheck, Download, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, PageHeaderBadge } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useHub } from '../contexts/hub-context';
import { api } from '../lib/api';
import type { Notification } from '../lib/types';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

export function NotificationsPage() {
  const { notify, refreshUnreadCount } = useHub();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api<Notification[]>('/notifications');
      setNotifications(data);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      await refreshUnreadCount();
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshUnreadCount();
      notify('Todas as notificações marcadas como lidas.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao marcar notificações.');
    }
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Inbox"
        title={
          <>
            Notificações{' '}
            <span className="text-sky-600 dark:text-sky-400">de resultados</span>
          </>
        }
        description="Notificações de agendamentos configurados para você. Clique para marcar como lida e baixar os arquivos."
        badge={unread > 0 ? <PageHeaderBadge>{unread} não lidas</PageHeaderBadge> : undefined}
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={() => void markAllRead()}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Carregando notificações...</div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">Nenhuma notificação ainda.</p>
          <p className="text-xs text-slate-400 mt-1">
            Notificações aparecem quando agendamentos enviarem resultados para você.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={() => void markRead(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const isError = notification.type === 'execution_error';
  const outputFiles = notification.execution?.files ?? [];

  return (
    <Card
      className={cn(
        'rounded-3xl transition',
        !notification.isRead && 'border-sky-200 dark:border-sky-900/60',
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {!notification.isRead && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
            )}
            <div className={!notification.isRead ? '' : 'ml-5'}>
              <CardTitle className="text-base">{notification.title}</CardTitle>
              {notification.body ? (
                <CardDescription className="mt-1">{notification.body}</CardDescription>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={isError ? 'error' : 'success'}>
              {isError ? 'Erro' : 'Sucesso'}
            </Badge>
            <span className="text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
          </div>
        </div>
      </CardHeader>

      {(outputFiles.length > 0 || notification.executionId) ? (
        <CardContent className="flex flex-wrap items-center gap-3 pt-0">
          {outputFiles.map((file) => (
            <a
              key={file.id}
              href={file.downloadUrl}
              download={file.downloadName ?? true}
              onClick={onMarkRead}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-zinc-200 dark:hover:bg-[#18181b]"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              {file.downloadName ?? 'arquivo'}
            </a>
          ))}
          {notification.executionId ? (
            <Button asChild variant="outline" size="sm" onClick={onMarkRead}>
              <Link to={`/executions/${notification.executionId}`}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Ver execução
              </Link>
            </Button>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
