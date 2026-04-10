import type { ReactNode } from 'react';
import { Badge } from './ui/badge';

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{eyebrow}</div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[1.8rem] font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.05rem]">
            {title}
          </h1>
          {badge ? badge : null}
        </div>
        {description ? <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function PageHeaderBadge({ children }: { children: ReactNode }) {
  return (
    <Badge className="border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950 dark:text-sky-200">
      {children}
    </Badge>
  );
}
