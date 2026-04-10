import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useHub } from '../contexts/hub-context';
import type { Execution } from '../lib/types';
import { formatDate, initialsFor, statusLabel, statusVariant } from '../lib/utils';

const STATUS_OPTIONS: Execution['status'][] = ['running', 'queued', 'success', 'error', 'canceled'];

export function HistoryPage() {
  const { executions, refreshHub, search } = useHub();
  const [userFilter, setUserFilter] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Execution['status'][]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredExecutions = useMemo(() => {
    const term = userFilter.trim().toLowerCase();
    const globalTerm = search.trim().toLowerCase();

    return executions.filter((execution) => {
      const name = execution.requestedByName?.toLowerCase() ?? '';
      const email = execution.requestedByEmail?.toLowerCase() ?? '';
      const robot = execution.robot?.name?.toLowerCase() ?? '';
      const step = execution.currentStep?.toLowerCase() ?? '';
      const matchesUser = !term || name.includes(term) || email.includes(term);
      const matchesGlobal =
        !globalTerm ||
        name.includes(globalTerm) ||
        email.includes(globalTerm) ||
        robot.includes(globalTerm) ||
        step.includes(globalTerm);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(execution.status);
      return matchesUser && matchesGlobal && matchesStatus;
    });
  }, [executions, search, statusFilter, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExecutions.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageStart = filteredExecutions.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const pageEnd = Math.min(filteredExecutions.length, currentPage * rowsPerPage);

  const pageExecutions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredExecutions.slice(start, start + rowsPerPage);
  }, [currentPage, filteredExecutions, rowsPerPage]);

  const toggleStatus = (status: Execution['status']) => {
    setPage(1);
    setStatusFilter((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
    );
  };

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage, userFilter, statusFilter]);

  useEffect(() => {
    let timer: number | undefined;
    const poll = async () => {
      await refreshHub();
      timer = window.setTimeout(poll, 2500);
    };
    void poll();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [refreshHub]);

  return (
    <div className="grid gap-5">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[1.8rem] font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.05rem]">
            Execuções{' '}
            <span className="text-sky-600 dark:text-sky-400">registradas</span>
          </h1>
          <Badge className="border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-500/55 dark:bg-sky-500/15 dark:text-sky-300">
            {filteredExecutions.length} registros
          </Badge>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Veja e filtre as execuções do hub.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:max-w-sm">
          <Input
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            placeholder="Filtrar por usuário ou email"
          />
        </div>

        <div className="relative">
          <Button variant="outline" onClick={() => setStatusMenuOpen((current) => !current)}>
            <Plus className="mr-2 h-4 w-4" />
            Status
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>

          {statusMenuOpen ? (
            <div className="absolute left-0 z-20 mt-2 w-72 rounded-2xl border border-slate-300 bg-white p-2 shadow-lg dark:border-[#2b2b31] dark:bg-[#111113]">
              <div className="mb-2 px-2 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Status</div>
              <div className="grid gap-1">
                {STATUS_OPTIONS.map((status) => {
                  const active = statusFilter.includes(status);

                  return (
                    <button
                      key={status}
                      type="button"
                      className={[
                        'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                        active
                          ? 'bg-slate-100 text-slate-950 dark:bg-[#1b1b20] dark:text-white'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#18181b]',
                      ].join(' ')}
                      onClick={() => toggleStatus(status)}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={[
                            'flex h-4 w-4 items-center justify-center rounded border',
                            active
                              ? 'border-sky-500 bg-sky-500 text-white'
                              : 'border-slate-300 bg-white dark:border-[#384965] dark:bg-transparent',
                          ].join(' ')}
                        >
                          {active ? <Check className="h-3 w-3" /> : null}
                        </span>
                        {statusLabel(status)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {executions.filter((execution) => execution.status === status).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl">
        <CardContent className="px-0 pb-2 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Execução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Etapa atual</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageExecutions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <Link to={`/executions/${execution.id}`} className="grid gap-1">
                      <span className="font-medium text-slate-950 dark:text-white">
                        {execution.robot?.name ?? 'Execução'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {execution.robot?.summary || execution.currentStep || 'Execução registrada no hub'}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(execution.status)}>{statusLabel(execution.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {initialsFor(execution.requestedByName || execution.requestedByEmail || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{execution.requestedByName || 'Usuário interno'}</div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {execution.requestedByEmail || ''}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">
                    {execution.currentStep || 'Aguardando na fila'}
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">{formatDate(execution.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 pb-2 pt-4 text-sm text-slate-500 dark:border-[#27272a] dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span>Linhas por página:</span>
              <select
                value={rowsPerPage}
                onChange={(event) => setRowsPerPage(Number(event.target.value))}
                className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>
                {pageStart}-{pageEnd} de {filteredExecutions.length}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
