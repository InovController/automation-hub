import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useHub } from '../contexts/hub-context';
import { api } from '../lib/api';
import type { TimeSavingsReport } from '../lib/types';
import { formatDate, formatSecondsToHuman } from '../lib/utils';

export function TimeSavingsPage() {
  const { hub, notify } = useHub();
  const [report, setReport] = useState<TimeSavingsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [robotId, setRobotId] = useState('');
  const [userId, setUserId] = useState('');

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

  const maxTrend = useMemo(() => {
    if (!report?.trend.length) return 1;
    return Math.max(1, ...report.trend.map((item) => item.savedSeconds));
  }, [report]);

  if (!report && loading) {
    return <p className="text-sm text-slate-500">Carregando relatório...</p>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Relatórios"
        title={
          <>
            Tempo ganho com{' '}
            <span className="text-sky-600 dark:text-sky-400">automações</span>
          </>
        }
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
            {(report?.byUser ?? []).map((user) => (
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
          <div className="grid divide-y divide-slate-200 dark:divide-[#27272a] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            <MetricInline
              label="Tempo manual evitado"
              value={formatSecondsToHuman(report?.totals.manualEstimatedSeconds ?? 0)}
              detail={`${report?.totals.executions ?? 0} execuções concluídas`}
            />
            <MetricInline
              label="Unidades processadas"
              value={String(report?.totals.unitsProcessed ?? 0)}
              detail="Soma das métricas enviadas pelos robôs"
            />
            <MetricInline
              label="Execuções analisadas"
              value={String(report?.totals.executions ?? 0)}
              detail="Base para cálculo de ganho"
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Economia por robô</CardTitle>
            <CardDescription>Top automações que mais economizaram tempo.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[420px] space-y-3 overflow-y-auto">
            {report?.byRobot.slice(0, 10).map((item) => (
              <div key={item.robotId} className="rounded-2xl border border-slate-200 p-4 dark:border-[#2b2b31]">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{item.robotName}</div>
                  <Badge variant="success">{formatSecondsToHuman(item.savedSeconds)}</Badge>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {item.executions} execuções · {item.unitsProcessed} unidades
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Economia por colaborador</CardTitle>
              <CardDescription>Quanto tempo cada pessoa economizou usando robôs.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[320px] space-y-3 overflow-y-auto">
              {report?.byUser.slice(0, 10).map((item) => (
                <div key={item.userId} className="rounded-2xl border border-slate-200 p-4 dark:border-[#2b2b31]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{item.userName}</div>
                    <Badge variant="success">{formatSecondsToHuman(item.savedSeconds)}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.executions} execuções · {item.unitsProcessed} unidades
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Evolução diária</CardTitle>
              <CardDescription>Tempo ganho por dia no período filtrado.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[320px] space-y-2 overflow-y-auto">
              {report?.trend.length ? (
                report.trend.slice(-14).map((point) => (
                  <div key={point.day} className="grid gap-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{new Date(point.day).toLocaleDateString('pt-BR')}</span>
                      <span>{formatSecondsToHuman(point.savedSeconds)}</span>
                    </div>
                    <div className="h-2 rounded bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-2 rounded bg-sky-500"
                        style={{ width: `${Math.max(3, (point.savedSeconds / maxTrend) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ainda não há dados suficientes para o período.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl">
        <CardHeader>
          <CardTitle>Execuções com economia calculada</CardTitle>
          <CardDescription>Detalhe para auditoria de ganhos.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Robô</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Tempo manual</TableHead>
                <TableHead>Tempo ganho</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.executions.slice(0, 80).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.robotName}</TableCell>
                  <TableCell>{item.userName}</TableCell>
                  <TableCell>
                    {item.unitsProcessed} {item.unitLabel}
                  </TableCell>
                  <TableCell>{formatSecondsToHuman(item.manualEstimatedSeconds)}</TableCell>
                  <TableCell>
                    <Badge variant="success">{formatSecondsToHuman(item.savedSeconds)}</Badge>
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
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}
