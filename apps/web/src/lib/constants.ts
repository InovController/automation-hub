import type { Department, UserRole } from './types';

export const DEPARTMENT_OPTIONS: Array<{ value: Department; label: string }> = [
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'contabil', label: 'Contábil' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'inovacao', label: 'Inovação' },
  { value: 'legalizacao', label: 'Legalização' },
  { value: 'certificacao', label: 'Certificação' },
  { value: 'auditoria', label: 'Auditoria' },
  { value: 'rh', label: 'RH' },
];

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
