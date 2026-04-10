import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppIcon } from '../components/app-icon';
import { PageHeader, PageHeaderBadge } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useHub } from '../contexts/hub-context';

export function RobotsPage() {
  const { hub, search } = useHub();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') ?? '';

  if (!hub) return <p className="text-sm text-slate-500">Carregando robos...</p>;

  const categories = useMemo(
    () =>
      [...new Set(hub.robots.map((robot) => robot.category).filter(Boolean))]
        .map((item) => item as string)
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [hub.robots],
  );

  const filtered = hub.robots.filter((robot) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      robot.name.toLowerCase().includes(term) ||
      (robot.summary ?? '').toLowerCase().includes(term);
    const matchesCategory = !categoryFilter || (robot.category ?? '') === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Catalogo"
        title={
          <>
            Robos{' '}
            <span className="text-sky-600 dark:text-sky-400">disponiveis</span>
          </>
        }
        description="Navegue pelo catalogo central e abra a configuracao de execucao em poucos cliques."
        badge={<PageHeaderBadge>{filtered.length} robos disponiveis</PageHeaderBadge>}
      />

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

      <div className="grid gap-5 xl:grid-cols-3">
        {filtered.map((robot) => (
          <Card key={robot.id} className="rounded-3xl">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <AppIcon icon={robot.icon} />
                <Badge variant={robot.isActive ? 'success' : 'muted'}>
                  {robot.isActive ? 'Disponivel' : 'Manutencao'}
                </Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">{robot.name}</CardTitle>
                <CardDescription>{robot.summary ?? 'Sem resumo cadastrado.'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between gap-4">
                  <span>Categoria</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {robot.category ?? 'Geral'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Versao</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">v{robot.version}</span>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link to={`/robots/${robot.id}`}>
                  Abrir automacao
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
