import type { HTMLAttributes } from 'react';
import { Bot, Building2, LineChart, ReceiptText } from 'lucide-react';
import { cn } from '../lib/utils';

export function AppIcon({ icon, className }: { icon?: string | null; className?: string } & HTMLAttributes<HTMLDivElement>) {
  const Icon =
    icon === 'bank'
      ? Building2
      : icon === 'receipt'
        ? ReceiptText
        : icon === 'chart'
          ? LineChart
          : Bot;

  return (
    <div
      className={cn(
        'grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}
