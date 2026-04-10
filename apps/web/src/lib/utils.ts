import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type StatusVariant =
  | 'default'
  | 'success'
  | 'running'
  | 'queued'
  | 'error'
  | 'canceled'
  | 'muted';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('pt-BR');
}

export function statusLabel(status: string) {
  return {
    success: 'Concluído',
    running: 'Em andamento',
    queued: 'Na fila',
    error: 'Erro',
    canceled: 'Cancelado',
  }[status] ?? 'Indisponível';
}

export function statusVariant(status: string): StatusVariant {
  const variants: Record<string, StatusVariant> = {
    success: 'success',
    running: 'running',
    queued: 'queued',
    error: 'error',
    canceled: 'canceled',
  };

  return variants[status] ?? 'muted';
}

export function initialsFor(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function departmentLabel(value: string) {
  return {
    pessoal: 'Pessoal',
    fiscal: 'Fiscal',
    contabil: 'Contábil',
    tecnologia: 'Tecnologia',
    inovacao: 'Inovação',
    legalizacao: 'Legalização',
    certificacao: 'Certificação',
    auditoria: 'Auditoria',
    rh: 'RH',
  }[value] ?? value;
}

export function userFileName(value?: string | null) {
  if (!value) return 'arquivo';
  const clean = value.trim();
  const withoutPrefixes = clean.replace(/^(?:\d{13}-[a-z0-9]{6}-)+/i, '');
  return withoutPrefixes || clean;
}

export function formatSecondsToHuman(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  return `${minutes}min`;
}
