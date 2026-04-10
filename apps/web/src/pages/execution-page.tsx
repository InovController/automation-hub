import { Download, FileInput, Files, SquareTerminal } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { PageHeader } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { useHub } from '../contexts/hub-context';
import { api } from '../lib/api';
import type { Execution } from '../lib/types';
import { formatDate, statusLabel, statusVariant, userFileName } from '../lib/utils';
import { useParams } from 'react-router-dom';

export function ExecutionPage() {
  const { id } = useParams();
  const { notify, refreshHub } = useHub();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      if (!id) return;
      try {
        const data = await api<Execution>(`/executions/${id}`);
        if (!cancelled) {
          setExecution(data);
          if (data.status === 'queued' || data.status === 'running') {
            timer = window.setTimeout(load, 2500);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar a execução.');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [id]);

  useEffect(() => {
    const terminal = document.querySelector('[data-terminal]');
    if (terminal instanceof HTMLElement) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }, [execution?.logs]);

  if (loadError) return <p className="text-sm text-rose-500">{loadError}</p>;
  if (!execution) return <p className="text-sm text-slate-500">Carregando execução...</p>;

  const isLive = execution.status === 'queued' || execution.status === 'running';
  const outputFiles = execution.files.filter((file) => file.kind !== 'input');
  const inputFiles = execution.files.filter((file) => file.kind === 'input');

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Execução"
        title={execution.robot.name}
        description={`ID ${execution.id} · iniciado em ${formatDate(execution.startedAt || execution.createdAt)}`}
        badge={<Badge variant={statusVariant(execution.status)}>{statusLabel(execution.status)}</Badge>}
        actions={
          isLive ? (
            <Button
              variant="danger"
              disabled={isCanceling}
              onClick={async () => {
                setIsCanceling(true);
                try {
                  await api(`/executions/${execution.id}/cancel`, { method: 'POST' });
                  notify('Execução cancelada.');
                  await refreshHub();
                } catch (err) {
                  notify(err instanceof Error ? err.message : 'Não foi possível cancelar a execução.');
                } finally {
                  setIsCanceling(false);
                }
              }}
            >
              {isCanceling ? 'Cancelando...' : 'Cancelar execução'}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Progresso" value={`${execution.progress}%`} />
        <MetricCard label="Solicitante" value={execution.requestedByName || execution.requestedByEmail || 'Usuário interno'} />
        <MetricCard label="Status" value={statusLabel(execution.status)} />
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Andamento</CardTitle>
          <CardDescription>{execution.currentStep || 'Aguardando início'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={execution.progress} />
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>Criado em {formatDate(execution.createdAt)}</span>
            {execution.finishedAt ? <span>Finalizado em {formatDate(execution.finishedAt)}</span> : null}
            {execution.errorMessage ? <span className="text-rose-500">Erro: {execution.errorMessage}</span> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-3xl">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
                <SquareTerminal className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle>Logs em tempo real</CardTitle>
                <CardDescription>Fluxo vivo do stdout e stderr processado pelo runner.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              data-terminal
              className="h-[min(65vh,560px)] overflow-y-auto bg-[#090b10] px-5 py-4 font-mono text-sm leading-7 text-emerald-300"
            >
              {execution.logs.length > 0
                ? execution.logs.map((log) => (
                    <div key={log.id}>
                      <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString('pt-BR')}]</span>{' '}
                      <span className="text-sky-300">{log.level.toUpperCase()}</span>: {log.message}
                    </div>
                  ))
                : '[aguardando] Ainda não há logs.'}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <FileCard
            title="Arquivos de saída"
            description="Downloads gerados nesta execução."
            icon={<Files className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
            files={outputFiles}
            emptyText="Ainda não há arquivos de saída disponíveis."
          />

          <FileCard
            title="Arquivos de entrada"
            description="Arquivos enviados pelo solicitante."
            icon={<FileInput className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
            files={inputFiles}
            emptyText="Esta execução não recebeu arquivos enviados."
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="space-y-2 p-6">
        <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function FileCard({
  title,
  description,
  icon,
  files,
  emptyText,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  files: Execution['files'];
  emptyText: string;
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">{icon}</div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div key={file.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {userFileName(file.downloadName || file.originalName || file.filename)}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{file.kind === 'input' ? 'Entrada' : 'Saída'}</div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={file.downloadUrl}
                    download={userFileName(file.downloadName || file.originalName || file.filename)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </a>
                </Button>
              </div>
              {index < files.length - 1 ? <Separator className="mt-4" /> : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {emptyText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
