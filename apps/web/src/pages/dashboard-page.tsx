import { ArrowRight, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuth } from '../contexts/auth-context';
import { useHub } from '../contexts/hub-context';
import { formatDate, statusLabel, statusVariant } from '../lib/utils';

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 animate-pulse gap-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-80 rounded bg-slate-100 dark:bg-slate-800/60" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-36 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_1fr] xl:items-start">
        <div className="h-72 rounded-3xl bg-slate-100 dark:bg-slate-800/50" />
        <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800/50" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { hub, hubError, executions, refreshHub } = useHub();
  const navigate = useNavigate();

  const filteredRobots = useMemo(
    () => hub?.robots ?? [],
    [hub],
  );

  const categories = useMemo(
    () =>
      [...new Set(filteredRobots.map((robot) => robot.category).filter(Boolean))].map(
        (item) => item as string,
      ),
    [filteredRobots],
  );

  const recentExecutions = useMemo(
    () => executions.slice(0, 6),
    [executions],
  );

  if (hubError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Não foi possível carregar o painel.
        </p>
        <Button variant="outline" size="sm" onClick={() => void refreshHub()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!hub) return <DashboardSkeleton />;

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        title={<>Operação das <span className="text-sky-600 dark:text-sky-400">automações</span></>}
        description="Acompanhe a saúde do hub, identifique gargalos na fila e navegue para as automações mais usadas."
        actions={
          <Button asChild>
            <Link to="/robots">
              Abrir catálogo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-800 dark:text-zinc-200">
          {hub.stats.totalRobots} robôs publicados
        </Badge>
        <Badge className="border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950 dark:text-sky-200">
          {hub.stats.readyRobots} prontos para executar
        </Badge>
        <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950 dark:text-indigo-200">
          {hub.stats.runningExecutions} em andamento
        </Badge>
        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950 dark:text-emerald-200">
          {hub.stats.successfulExecutions} concluídas com sucesso
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_1fr] xl:items-start">
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Execuções recentes</CardTitle>
              <CardDescription>
                {user?.role === 'employee'
                  ? 'Visão rápida das suas últimas execuções.'
                  : 'Visão rápida das últimas execuções do seu escopo.'}
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/history">Ver histórico</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-2 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Automação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExecutions.length > 0 ? (
                  recentExecutions.map((execution) => (
                    <TableRow
                      key={execution.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/executions/${execution.id}`)}
                    >
                      <TableCell>
                        <div className="grid grid-cols-1 gap-1">
                          <span className="font-medium text-slate-950 dark:text-white">
                            {execution.robot?.name ?? 'Execução'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">
                            {execution.currentStep || 'Aguardando na fila'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(execution.status)}>
                          {statusLabel(execution.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-zinc-400">
                        {execution.requestedByName || execution.requestedByEmail || 'Usuário interno'}
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-zinc-400">
                        {formatDate(execution.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 dark:text-zinc-400">
                      Nenhuma execução registrada ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Áreas com automação</CardTitle>
            <CardDescription>Distribuição do catálogo por domínio de negócio.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {categories.length > 0 ? (
              categories.map((category) => {
                const total = filteredRobots.filter((robot) => robot.category === category).length;
                return (
                  <Link
                    key={category}
                    to={`/robots?category=${encodeURIComponent(category)}`}
                    className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-[#2b2b31] dark:hover:bg-[#18181b]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-medium">{category}</div>
                      <Badge variant="muted">{total}</Badge>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Nenhuma área cadastrada ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
