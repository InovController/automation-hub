import { Download, FileDown, Inbox } from 'lucide-react';
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

// TODO: Este é um ponto de entrada para pensar uma aba de resultados mais rica futuramente.
// Atualmente mostra as mesmas notificações mas focado nos arquivos para download,
// sem o conceito de lido/não lido — apenas um repositório de outputs recebidos.

export function ResultsPage() {
  const { notify } = useHub();
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
      notify(error instanceof Error ? error.message : 'Não foi possível carregar os resultados.');
    } finally {
      setLoading(false);
    }
  }

  const withFiles = notifications.filter(
    (n) => n.execution?.files && n.execution.files.length > 0,
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Outputs"
        title={
          <>
            Resultados{' '}
            <span className="text-sky-600 dark:text-sky-400">recebidos</span>
          </>
        }
        description="Arquivos de saída de agendamentos enviados para você. Download direto sem precisar abrir a execução."
        badge={<PageHeaderBadge>{withFiles.length} com arquivos</PageHeaderBadge>}
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Carregando resultados...</div>
      ) : withFiles.length === 0 ? (
        <div className="py-16 text-center">
          <Inbox className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">Nenhum resultado com arquivo ainda.</p>
          <p className="text-xs text-slate-400 mt-1">
            Resultados aparecem quando agendamentos concluídos tiverem arquivos para você.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {withFiles.map((notification) => (
            <ResultCard key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ notification }: { notification: Notification }) {
  const files = notification.execution?.files ?? [];
  const robotName = notification.execution?.robot.name ?? '—';
  const isError = notification.type === 'execution_error';

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{robotName}</CardTitle>
            <CardDescription className="mt-0.5 text-xs">{notification.title}</CardDescription>
          </div>
          <Badge variant={isError ? 'error' : 'success'} className="shrink-0 text-xs">
            {isError ? 'Erro' : 'Sucesso'}
          </Badge>
        </div>
        <p className="text-xs text-slate-400">{formatDate(notification.createdAt)}</p>
      </CardHeader>

      <CardContent className="grid gap-2 pt-0">
        {files.map((file) => (
          <a
            key={file.id}
            href={file.downloadUrl}
            download={file.downloadName ?? true}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-zinc-200 dark:hover:bg-[#18181b]"
          >
            <FileDown className="h-4 w-4 shrink-0 text-sky-500" />
            <span className="truncate">{file.downloadName ?? 'arquivo'}</span>
            <Download className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" />
          </a>
        ))}

        {notification.executionId ? (
          <Button asChild variant="outline" size="sm" className="mt-1 justify-center">
            <Link to={`/executions/${notification.executionId}`}>Ver execução completa</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
