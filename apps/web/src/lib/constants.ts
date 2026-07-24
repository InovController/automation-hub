import type { UserRole } from './types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Gestor',
  employee: 'Funcionário',
};

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];
