import type { SiteStatus } from '../lib/types';
import { cn } from '../lib/utils';

const DOT_STYLE: Record<SiteStatus, { fill: string; border: string; glow: string }> = {
  online: {
    fill: 'bg-[radial-gradient(circle_at_32%_28%,theme(colors.emerald.300),theme(colors.emerald.700)_75%)]',
    border: 'border border-emerald-300/70 dark:border-emerald-500/40',
    glow: 'shadow-[0_0_5px_1px_rgba(4,120,87,0.5)]',
  },
  maintenance: {
    fill: 'bg-[radial-gradient(circle_at_32%_28%,theme(colors.amber.200),theme(colors.amber.500)_75%)]',
    border: 'border border-amber-200/70 dark:border-amber-500/40',
    glow: 'shadow-[0_0_5px_1px_rgba(217,119,6,0.45)]',
  },
  down: {
    fill: 'bg-[radial-gradient(circle_at_32%_28%,theme(colors.rose.300),theme(colors.rose.600)_75%)]',
    border: 'border border-rose-300/70 dark:border-rose-500/40',
    glow: 'shadow-[0_0_5px_1px_rgba(225,29,72,0.45)]',
  },
};

export function StatusDot({
  status,
  title,
  className,
}: {
  status: SiteStatus;
  title?: string;
  className?: string;
}) {
  const style = DOT_STYLE[status];
  // Online "respira" com um brilho pulsante discreto (vivo, monitorado); fora do ar
  // ganha um anel expandindo porque precisa chamar atenção de verdade. Manutenção fica parado.
  const breathing = status === 'online';
  const urgent = status === 'down';

  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5 flex-shrink-0', className)} title={title}>
      {urgent ? (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none',
            style.fill,
          )}
        />
      ) : null}
      <span
        className={cn(
          'relative inline-block h-2.5 w-2.5 rounded-full',
          style.fill,
          style.border,
          breathing ? 'animate-glow-pulse motion-reduce:animate-none motion-reduce:shadow-none' : style.glow,
        )}
      />
    </span>
  );
}
