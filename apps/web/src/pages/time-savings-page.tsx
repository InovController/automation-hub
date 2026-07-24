import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useHub } from '../contexts/hub-context';
import { api } from '../lib/api';
import type { TimeSavingsReport } from '../lib/types';
import { formatDate, formatSecondsToHuman } from '../lib/utils';

const DEPT_LABEL: Record<string, string> = {
  pessoal: 'Pessoal',
  fiscal: 'Fiscal',
  contabil: 'Contábil',
  tecnologia: 'Tecnologia',
  inovacao: 'Inovação',
  legalizacao: 'Legalização',
  certificacao: 'Certificação',
  auditoria: 'Auditoria',
  rh: 'RH',
};

export function TimeSavingsPage() {
  const { hub, notify } = useHub();
  const [report, setReport] = useState<TimeSavingsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [robotId, setRobotId] = useState('');
  const [userId, setUserId] = useState('');
  const [userOptions, setUserOptions] = useState<Array<{ userId: string; userName: string }>>([]);
  const [execPage, setExecPage] = useState(0);

  const PAGE_SIZE = 10;

  const robots = hub?.robots ?? [];

  async function loadReport(overrides?: {
    from?: string;
    to?: string;
    robotId?: string;
    userId?: string;
  }) {
    setLoading(true);
    try {
      const currentFrom = overrides?.from ?? from;
      const currentTo = overrides?.to ?? to;
      const currentRobotId = overrides?.robotId ?? robotId;
      const currentUserId = overrides?.userId ?? userId;
      const query = new URLSearchParams();
      if (currentFrom) query.set('from', currentFrom);
      if (currentTo) query.set('to', currentTo);
      if (currentRobotId) query.set('robotId', currentRobotId);
      if (currentUserId) query.set('userId', currentUserId);
      const data = await api<TimeSavingsReport>(`/reports/time-savings?${query.toString()}`);
      setReport(data);
      setExecPage(0);
      // O select de colaboradores não pode ser alimentado pelo resultado já
      // filtrado por usuário — depois de filtrar só sobraria ele na lista
      if (!currentUserId) {
        setUserOptions(data.byUser.map((item) => ({ userId: item.userId, userName: item.userName })));
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxSavedRobot = useMemo(() => {
    if (!report?.byRobot.length) return 1;
    return Math.max(1, report.byRobot[0].savedSeconds);
  }, [report]);

  const maxSavedUser = useMemo(() => {
    if (!report?.byUser.length) return 1;
    return Math.max(1, report.byUser[0].savedSeconds);
  }, [report]);

  const maxSavedDept = useMemo(() => {
    if (!report?.byDepartment.length) return 1;
    return Math.max(1, report.byDepartment[0].savedSeconds);
  }, [report]);

  if (!report && loading) {
    return <p role="status" aria-live="polite" className="text-sm text-slate-500">Carregando relatório...</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        title={<>Tempo ganho com <span className="text-sky-600 dark:text-sky-400">automações</span></>}
        description="Mostra quanto tempo manual foi economizado por robô, usuário e período."
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
        <div className="w-full xl:w-[180px]">
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div className="w-full xl:w-[180px]">
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <div className="w-full xl:w-[240px]">
          <select
            className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100"
            value={robotId}
            onChange={(event) => setRobotId(event.target.value)}
          >
            <option value="">Todos os robôs</option>
            {robots.map((robot) => (
              <option key={robot.id} value={robot.id}>
                {robot.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full xl:w-[260px]">
          <select
            className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          >
            <option value="">Todos os colaboradores</option>
            {userOptions.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.userName}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" onClick={() => void loadReport()} disabled={loading}>
          {loading ? 'Atualizando...' : 'Aplicar filtros'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setFrom('');
            setTo('');
            setRobotId('');
            setUserId('');
            void loadReport({ from: '', to: '', robotId: '', userId: '' });
          }}
        >
          Limpar
        </Button>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-[#27272a] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            <MetricInline
              label="Tempo manual evitado"
              value={formatSecondsToHuman(report?.totals.manualEstimatedSeconds ?? 0)}
              detail={`${report?.totals.executions ?? 0} execuções concluídas`}
            />
            <MetricInline
              label="Dias úteis economizados"
              value={formatWorkDays(report?.totals.savedSeconds ?? 0)}
              detail="Equivalente em jornadas de trabalho de 8h"
            />
            <MetricInline
              label="Robôs contribuindo"
              value={String(report?.byRobot.length ?? 0)}
              detail="Automações com economia calculada no período"
            />
            <MetricInline
              label="Ganho médio por execução"
              value={formatSecondsToHuman(
                report?.totals.executions
                  ? Math.round((report.totals.savedSeconds || 0) / report.totals.executions)
                  : 0,
              )}
              detail="No período filtrado"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Economia por robô</CardTitle>
            <CardDescription>Top automações que mais economizaram tempo.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-[#1f1f22]">
            {report?.byRobot.slice(0, 10).map((item, idx) => (
              <div key={item.robotId} className="grid gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-4 flex-shrink-0 text-right text-xs text-slate-400 dark:text-zinc-600">{idx + 1}</span>
                    <span className="truncate font-medium text-slate-900 dark:text-zinc-100">{item.robotName}</span>
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {formatSecondsToHuman(item.savedSeconds)}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-1.5 rounded-full bg-sky-400 dark:bg-sky-500"
                      style={{ width: `${Math.max(2, (item.savedSeconds / maxSavedRobot) * 100)}%` }}
                    />
                  </div>
                  <span className="flex-shrink-0 text-xs text-slate-400 dark:text-zinc-500">{item.executions} exec.</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Economia por colaborador</CardTitle>
              <CardDescription>Quanto tempo cada pessoa economizou usando robôs.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-[#1f1f22]">
              {report?.byUser.slice(0, 10).map((item, idx) => (
                <div key={item.userId} className="grid gap-1.5 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-4 flex-shrink-0 text-right text-xs text-slate-400 dark:text-zinc-600">{idx + 1}</span>
                      <span className="truncate font-medium text-slate-900 dark:text-zinc-100">{item.userName}</span>
                    </div>
                    <span className="flex-shrink-0 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                      {formatSecondsToHuman(item.savedSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-1.5 rounded-full bg-sky-400 dark:bg-sky-500"
                        style={{ width: `${Math.max(2, (item.savedSeconds / maxSavedUser) * 100)}%` }}
                      />
                    </div>
                    <span className="flex-shrink-0 text-xs text-slate-400 dark:text-zinc-500">{item.executions} exec.</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Economia por departamento</CardTitle>
              <CardDescription>Áreas que mais utilizaram automações no período.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-[#1f1f22]">
              {report?.byDepartment.length ? (
                report.byDepartment.map((item, idx) => (
                  <div key={item.department} className="grid gap-1.5 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-4 flex-shrink-0 text-right text-xs text-slate-400 dark:text-zinc-600">{idx + 1}</span>
                        <span className="truncate font-medium text-slate-900 dark:text-zinc-100 capitalize">
                          {DEPT_LABEL[item.department] ?? item.department}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                        {formatSecondsToHuman(item.savedSeconds)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-1.5 rounded-full bg-sky-400 dark:bg-sky-500"
                          style={{ width: `${Math.max(2, (item.savedSeconds / maxSavedDept) * 100)}%` }}
                        />
                      </div>
                      <span className="flex-shrink-0 text-xs text-slate-400 dark:text-zinc-500">{item.executions} exec.</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Ainda não há dados suficientes para o período.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Execuções com economia calculada</CardTitle>
            <CardDescription>Detalhe para auditoria de ganhos.</CardDescription>
          </div>
          {(report?.executions.length ?? 0) > PAGE_SIZE && (
            <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
              <span>
                {execPage * PAGE_SIZE + 1}–{Math.min((execPage + 1) * PAGE_SIZE, report!.executions.length)} de {report!.executions.length}
              </span>
              <button
                type="button"
                disabled={execPage === 0}
                onClick={() => setExecPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium transition hover:bg-slate-50 disabled:opacity-40 dark:border-[#2b2b31] dark:hover:bg-white/[0.04]"
              >
                ← Anterior
              </button>
              <button
                type="button"
                disabled={(execPage + 1) * PAGE_SIZE >= (report?.executions.length ?? 0)}
                onClick={() => setExecPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium transition hover:bg-slate-50 disabled:opacity-40 dark:border-[#2b2b31] dark:hover:bg-white/[0.04]"
              >
                Próximo →
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Robô</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Tempo ganho</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.executions.slice(execPage * PAGE_SIZE, (execPage + 1) * PAGE_SIZE).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.robotName}</TableCell>
                  <TableCell>{item.userName}</TableCell>
                  <TableCell>
                    {item.unitsProcessed === 1 && item.unitLabel === 'item'
                      ? null
                      : `${item.unitsProcessed} ${item.unitLabel}`}
                  </TableCell>
                  <TableCell className="font-medium text-sky-600 dark:text-sky-400">
                    {formatSecondsToHuman(item.savedSeconds)}
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function formatWorkDays(seconds: number): string {
  const days = seconds / 28800;
  if (days < 0.1) return '< 0,1 dias';
  if (days >= 30) return `${Math.round(days / 5)} semanas`;
  return `${days.toFixed(1).replace('.', ',')} dias`;
}

function MetricInline({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="space-y-2 p-6">
      <p className="text-sm text-slate-500 dark:text-zinc-400">{label}</p>
      <p className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}
