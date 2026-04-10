import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]',
  {
    variants: {
      variant: {
        default: 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950 dark:text-sky-200',
        success: 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950 dark:text-emerald-200',
        running: 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950 dark:text-sky-200',
        queued: 'border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950 dark:text-indigo-200',
        error: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950 dark:text-amber-200',
        canceled: 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950 dark:text-rose-200',
        muted: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-800 dark:text-slate-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type Props = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: Props) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
