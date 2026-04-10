import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-zinc-100',
        className,
      )}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('leading-none', className)} {...props} />;
}
