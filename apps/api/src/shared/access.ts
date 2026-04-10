import {
  type Department,
  type Execution,
  type Robot,
  type User,
  UserRole,
} from '@prisma/client';

export const COMPANY_DEPARTMENTS: Department[] = [
  'pessoal',
  'fiscal',
  'contabil',
  'tecnologia',
  'inovacao',
  'legalizacao',
  'certificacao',
  'auditoria',
  'rh',
];

type MinimalUser = Pick<User, 'id' | 'role' | 'departments'>;
type MinimalRobot = Pick<Robot, 'allowedDepartments'>;
type MinimalExecution = Pick<Execution, 'userId'> & {
  user?: Pick<User, 'departments'> | null;
};

export function isAdmin(user: MinimalUser) {
  return user.role === UserRole.admin;
}

export function isManager(user: MinimalUser) {
  return user.role === UserRole.manager;
}

export function canManageRobots(user: MinimalUser) {
  return isAdmin(user);
}

export function canAccessRobot(user: MinimalUser, robot: MinimalRobot) {
  if (isAdmin(user)) {
    return true;
  }

  if (!robot.allowedDepartments || robot.allowedDepartments.length === 0) {
    return true;
  }

  return robot.allowedDepartments.some((department) =>
    user.departments.includes(department),
  );
}

export function canAccessExecution(user: MinimalUser, execution: MinimalExecution) {
  if (isAdmin(user)) {
    return true;
  }

  if (isManager(user)) {
    return Boolean(
      execution.user?.departments?.some((department) =>
        user.departments.includes(department),
      ),
    );
  }

  return execution.userId === user.id;
}

export function normalizeDepartments(value: unknown): Department[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is Department =>
          typeof item === 'string' &&
          COMPANY_DEPARTMENTS.includes(item as Department),
      ),
    ),
  );
}
