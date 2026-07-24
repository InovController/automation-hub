import { ArrowRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppIcon } from '../components/app-icon';
import { PageHeader } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/auth-context';
import { useHub } from '../contexts/hub-context';

export function RobotsPage() {
  const { user } = useAuth();
  const { hub, hubError, refreshHub } = useHub();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const categoryFilter = searchParams.get('category') ?? '';

  const robots = hub?.robots ?? [];

  // Filtro por categoria só faz sentido pra quem enxerga robôs de mais de um setor —
  // um usuário com um único departamento sempre veria uma categoria só.
  const canFilterByCategory =
    user?.role === 'admin' || (user?.departments.length ?? 0) > 1;

  const categories = useMemo(
    () =>
      [...new Set(robots.map((robot) => robot.category).filter(Boolean))]
        .map((item) => item as string)
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [robots],
  );

  const filtered = useMemo(
    () =>
      robots.filter((robot) => {
        const term = query.trim().toLowerCase();
        const matchesSearch =
          !term ||
          robot.name.toLowerCase().includes(term) ||
          (robot.summary ?? '').toLowerCase().includes(term);
        const matchesCategory = !categoryFilter || (robot.category ?? '') === categoryFilter;
        return matchesSearch && matchesCategory;
      }),
    [robots, query, categoryFilter],
  );

  if (!hub && hubError) {
    return (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-950/20 dark:text-rose-400"
      >
        <span>Não foi possível carregar o catálogo de robôs.</span>
        <Button variant="outline" onClick={() => void refreshHub()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!hub) {
    return (
      <div role="status" aria-live="polite" className="grid grid-cols-1 animate-pulse gap-6">
        <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-3xl bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        title={<>Robôs <span className="text-sky-600 dark:text-sky-400">disponíveis</span></>}
        description="Navegue pelo catálogo central e abra a configuração de execução em poucos cliques."
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-10 pl-9"
            placeholder="Buscar robô..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {canFilterByCategory ? (
          <div className="w-full sm:max-w-xs">
            <select
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100"
              value={categoryFilter}
              onChange={(event) => {
                const value = event.target.value;
                const next = new URLSearchParams(searchParams);
                if (value) {
                  next.set('category', value);
                } else {
                  next.delete('category');
                }
                setSearchParams(next);
              }}
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {filtered.map((robot) => (
          <Card key={robot.id} className="flex flex-col rounded-3xl">
            <CardHeader className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <AppIcon icon={robot.icon} />
                <Badge variant={robot.isActive ? 'success' : 'muted'}>
                  {robot.isActive ? 'Disponível' : 'Manutenção'}
                </Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">{robot.name}</CardTitle>
                <CardDescription>{robot.summary ?? 'Sem resumo cadastrado.'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-3 text-sm text-slate-500 dark:text-zinc-400">
                <div className="flex items-center justify-between gap-4">
                  <span>Categoria</span>
                  <span className="font-medium text-slate-700 dark:text-zinc-200">
                    {robot.category ?? 'Geral'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Versão</span>
                  <span className="font-medium text-slate-700 dark:text-zinc-200">v{robot.version}</span>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link to={`/robots/${robot.slug}`}>
                  Abrir automação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 ? (
          <div className="xl:col-span-3">
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {query ? `Nenhum robô encontrado para "${query}".` : 'Nenhum robô disponível nesta categoria.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
