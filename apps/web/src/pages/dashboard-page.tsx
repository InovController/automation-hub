import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, PageHeaderBadge } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuth } from '../contexts/auth-context';
import { useHub } from '../contexts/hub-context';
import { formatDate, statusLabel, statusVariant } from '../lib/utils';

export function DashboardPage() {
  const { user } = useAuth();
  const { hub, executions, search } = useHub();

  if (!hub) return <p className="text-sm text-slate-500">Carregando painel...</p>;

  const searchTerm = search.trim().toLowerCase();
  const filteredRobots = useMemo(
    () =>
      hub.robots.filter((robot) => {
        if (!searchTerm) return true;
        return (
          robot.name.toLowerCase().includes(searchTerm) ||
          (robot.summary ?? '').toLowerCase().includes(searchTerm) ||
          (robot.category ?? '').toLowerCase().includes(searchTerm)
        );
      }),
    [hub.robots, searchTerm],
  );
  const categories = useMemo(
    () =>
      [...new Set(filteredRobots.map((robot) => robot.category).filter(Boolean))].map(
        (item) => item as string,
      ),
    [filteredRobots],
  );
  const recentExecutions = useMemo(
    () =>
      executions
        .filter((execution) => {
          if (!searchTerm) return true;
          return (
            (execution.robot?.name ?? '').toLowerCase().includes(searchTerm) ||
            (execution.requestedByName ?? '').toLowerCase().includes(searchTerm) ||
            (execution.requestedByEmail ?? '').toLowerCase().includes(searchTerm) ||
            (execution.currentStep ?? '').toLowerCase().includes(searchTerm)
          );
        })
        .slice(0, 6),
    [executions, searchTerm],
  );
  const activeRobots = useMemo(
    () => filteredRobots.filter((robot) => robot.isActive),
    [filteredRobots],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Painel"
        title={
          <>
            Operacao das{' '}
            <span className="text-sky-600 dark:text-sky-400">automacoes</span>
          </>
        }
        description="Acompanhe a saude do hub, identifique gargalos na fila e navegue para as automacoes mais usadas."
        badge={<PageHeaderBadge>Ambiente interno</PageHeaderBadge>}
        actions={
          <Button asChild>
            <Link to="/robots">
              Abrir catalogo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-800 dark:text-slate-200">
          {hub.stats.totalRobots} robos publicados
        </Badge>
        <Badge className="border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950 dark:text-sky-200">
          {hub.stats.readyRobots} prontos para executar
        </Badge>
        <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950 dark:text-indigo-200">
          {hub.stats.runningExecutions} em andamento
        </Badge>
        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950 dark:text-emerald-200">
          {hub.stats.successfulExecutions} concluidas com sucesso
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[3fr_1fr] xl:items-start">
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Execucoes recentes</CardTitle>
              <CardDescription>
                {user?.role === 'employee'
                  ? 'Visao rapida das suas ultimas execucoes.'
                  : 'Visao rapida das ultimas execucoes do seu escopo.'}
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/history">Ver historico</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-2 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Automacao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExecutions.length > 0 ? (
                  recentExecutions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <Link to={`/executions/${execution.id}`} className="grid gap-1">
                          <span className="font-medium text-slate-950 dark:text-white">
                            {execution.robot?.name ?? 'Execucao'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {execution.currentStep || 'Aguardando na fila'}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(execution.status)}>{statusLabel(execution.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {execution.requestedByName || execution.requestedByEmail || 'Usuario interno'}
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {formatDate(execution.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 dark:text-slate-400">
                      Nenhum resultado para a busca atual.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Areas com automacao</CardTitle>
            <CardDescription>Distribuicao do catalogo por dominio de negocio.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
                      <Badge variant="muted">{total} robos</Badge>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma area encontrada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Automacoes prontas</CardTitle>
          <CardDescription>As mais aptas para uso imediato no momento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {activeRobots.slice(0, 6).map((robot) => (
            <Link
              key={robot.id}
              to={`/robots/${robot.id}`}
              className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-[#2b2b31] dark:hover:bg-[#18181b]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-1">
                  <div className="font-medium">{robot.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {robot.summary || 'Sem resumo cadastrado.'}
                  </div>
                </div>
                <Badge variant="success">Disponivel</Badge>
              </div>
            </Link>
          ))}
          {activeRobots.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma automacao pronta encontrada.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
