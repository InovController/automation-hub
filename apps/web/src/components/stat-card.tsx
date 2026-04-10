import type { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';

export function StatCard({
  label,
  value,
  footnote,
  icon,
}: {
  label: string;
  value: ReactNode;
  footnote?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="rounded-[22px]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {icon ? <div className="text-slate-400 dark:text-slate-500">{icon}</div> : null}
        </div>
        <div className="text-[1.85rem] font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.1rem]">
          {value}
        </div>
        {footnote ? <p className="text-sm text-slate-500 dark:text-slate-400">{footnote}</p> : null}
      </CardContent>
    </Card>
  );
}
