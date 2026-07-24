import { Download, FileDown, Inbox } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { useHub } from '../contexts/hub-context';
import { api, downloadWithFeedback } from '../lib/api';
import type { Notification } from '../lib/types';
import { cn } from '../lib/utils';

type DateFilter = 'today' | 'yesterday' | 'week' | 'all';

const FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'week', label: 'Esta semana' },
  { key: 'all', label: 'Tudo' },
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toDateKey(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function groupByDate(notifications: Notification[]) {
  const todayStr = toDateKey(new Date());
  const yesterdayStr = toDateKey(new Date(Date.now() - 86_400_000));

  const map = new Map<string, { items: Notification[]; dateMs: number }>();
  for (const n of notifications) {
    const d = new Date(n.createdAt);
    const key = toDateKey(d);
    if (!map.has(key)) {
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      map.set(key, { items: [], dateMs: startOfDay });
    }
    map.get(key)!.items.push(n);
  }

  return Array.from(map.entries()).map(([key, { items, dateMs }]) => {
    const label = key === todayStr ? 'hoje' : key === yesterdayStr ? 'ontem' : `em ${key}`;
    return { key, label, items, dateMs };
  });
}

function applyFilter(
  groups: ReturnType<typeof groupByDate>,
  filter: DateFilter,
) {
  const todayStr = toDateKey(new Date());
  const yesterdayStr = toDateKey(new Date(Date.now() - 86_400_000));
  const weekAgoMs = Date.now() - 7 * 86_400_000;

  if (filter === 'today') return groups.filter((g) => g.key === todayStr);
  if (filter === 'yesterday') return groups.filter((g) => g.key === yesterdayStr);
  if (filter === 'week') return groups.filter((g) => g.dateMs >= weekAgoMs);
  return groups;
}

export function ResultsPage() {
  const { notify } = useHub();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DateFilter>('today');

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

  const allGroups = groupByDate(withFiles);
  const groups = applyFilter(allGroups, filter);

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        title={<>Resultados <span className="text-sky-600 dark:text-sky-400">recebidos</span></>}
        description="Arquivos de saída de agendamentos enviados para você. Download direto sem precisar abrir a execução."
      />

      {/* Filtro de período */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-[#27272a] dark:bg-[#111113]">
        {FILTERS.map(({ key, label }) => {
          const count = applyFilter(allGroups, key).reduce((sum, g) => sum + g.items.length, 0);
          const isActive = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={[
                'flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-medium transition',
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-[#1b1b20] dark:text-white'
                  : 'text-slate-700 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
              ].join(' ')}
            >
              {label}
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-xs',
                  isActive
                    ? 'bg-slate-100 text-slate-600 dark:bg-[#27272a] dark:text-zinc-300'
                    : 'bg-transparent text-slate-400 dark:text-zinc-500',
                ].join(' ')}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center">
          <Inbox className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-zinc-600" />
          <p className="text-sm text-slate-500">Nenhum resultado neste período.</p>
          <p className="mt-1 text-xs text-slate-400">
            Tente selecionar um período maior ou aguarde novos agendamentos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(({ key, label, items }) => (
            <div key={key}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                  Resultados {label}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-[#27272a]" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#27272a]">
                {items.map((notification) => (
                  <ResultRow key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultRow({ notification }: { notification: Notification }) {
  const { notify } = useHub();
  const files = notification.execution?.files ?? [];
  const robotName = notification.execution?.robot.name ?? '—';
  const isError = notification.type === 'execution_error';

  return (
    <div className="flex items-start gap-4 py-4 first:pt-0">
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          isError ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20',
        )}
      >
        <FileDown className={cn('h-4 w-4', isError ? 'text-red-500' : 'text-emerald-500')} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{robotName}</span>
          <Badge variant={isError ? 'error' : 'success'} className="text-xs">
            {isError ? 'Erro' : 'Sucesso'}
          </Badge>
          <span className="text-xs text-slate-400">{formatTime(notification.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{notification.title}</p>

        {files.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {files.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => void downloadWithFeedback(file.downloadUrl, file.downloadName ?? 'arquivo', notify)}
                className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-zinc-200 dark:hover:bg-[#18181b]"
              >
                <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">{file.downloadName ?? 'arquivo'}</span>
                <Download className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        )}

        {notification.executionId ? (
          <Link
            to={`/executions/${notification.executionId}`}
            className="mt-2 inline-block text-xs text-slate-400 transition hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Ver execução completa →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
