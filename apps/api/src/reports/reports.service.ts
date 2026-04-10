import { Injectable } from '@nestjs/common';
import { ExecutionStatus, Prisma, type User } from '@prisma/client';
import {
  canAccessExecution,
  canAccessRobot,
  isAdmin,
  isManager,
} from '../shared/access';
import { PrismaService } from '../prisma/prisma.service';

type QueryInput = {
  from?: string;
  to?: string;
  robotId?: string;
  userId?: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeSavingsReport(user: User, query: QueryInput) {
    const createdAtFilter: Prisma.DateTimeFilter = {};
    const fromDate = parseDate(query.from);
    const toDate = parseDate(query.to);

    if (fromDate) {
      createdAtFilter.gte = atStartOfDay(fromDate);
    }
    if (toDate) {
      createdAtFilter.lte = atEndOfDay(toDate);
    }

    const where: Prisma.ExecutionWhereInput = {
      status: ExecutionStatus.success,
      ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
      ...(query.robotId ? { robotId: query.robotId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...buildExecutionScope(user),
    };

    const executions = await this.prisma.execution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        robot: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            departments: true,
          },
        },
      },
      take: 2000,
    });

    const visibleExecutions = executions.filter(
      (execution) =>
        canAccessExecution(user, execution) && canAccessRobot(user, execution.robot),
    );

    const normalized = visibleExecutions.map((execution) => {
      const units = resolveUnitsProcessed(execution.unitsProcessed);
      const manualEstimatedSeconds =
        execution.manualEstimatedSeconds ??
        calculateManualEstimatedSeconds(execution.robot, units);

      return {
        id: execution.id,
        createdAt: execution.createdAt.toISOString(),
        robotId: execution.robotId,
        robotName: execution.robot.name,
        userId: execution.userId,
        userName: execution.requestedByName || execution.user?.name || execution.requestedByEmail || 'Usuário',
        unitsProcessed: units,
        unitLabel: execution.robot.unitLabel || 'item',
        manualEstimatedSeconds,
        savedSeconds: manualEstimatedSeconds,
      };
    });

    const totals = normalized.reduce(
      (acc, item) => {
        acc.executions += 1;
        acc.savedSeconds += item.savedSeconds;
        acc.manualEstimatedSeconds += item.manualEstimatedSeconds;
        acc.unitsProcessed += item.unitsProcessed;
        return acc;
      },
      {
        executions: 0,
        savedSeconds: 0,
        manualEstimatedSeconds: 0,
        unitsProcessed: 0,
      },
    );

    const byRobot = aggregateByRobot(normalized);
    const byUser = aggregateByUser(normalized);
    const trend = aggregateTrend(normalized);

    return {
      totals,
      byRobot,
      byUser,
      trend,
      executions: normalized.slice(0, 300),
    };
  }
}

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function atStartOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function atEndOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function calculateManualEstimatedSeconds(
  robot: {
    manualSecondsPerUnit: number;
  },
  unitsProcessed: number,
) {
  const unitSeconds = Math.max(0, robot.manualSecondsPerUnit || 0);
  const units = Math.max(0, unitsProcessed || 0);

  return unitSeconds * units;
}

function resolveUnitsProcessed(value: number | null) {
  if (value === null || value === undefined) {
    return 1;
  }

  return Math.max(0, value);
}

function aggregateByRobot(
  entries: Array<{
    robotId: string;
    robotName: string;
    savedSeconds: number;
    manualEstimatedSeconds: number;
    unitsProcessed: number;
  }>,
) {
  const map = new Map<string, {
    robotId: string;
    robotName: string;
    executions: number;
    savedSeconds: number;
    manualEstimatedSeconds: number;
    unitsProcessed: number;
  }>();

  for (const item of entries) {
    const current = map.get(item.robotId) ?? {
      robotId: item.robotId,
      robotName: item.robotName,
      executions: 0,
      savedSeconds: 0,
      manualEstimatedSeconds: 0,
      unitsProcessed: 0,
    };

    current.executions += 1;
    current.savedSeconds += item.savedSeconds;
    current.manualEstimatedSeconds += item.manualEstimatedSeconds;
    current.unitsProcessed += item.unitsProcessed;
    map.set(item.robotId, current);
  }

  return Array.from(map.values()).sort((a, b) => b.savedSeconds - a.savedSeconds);
}

function aggregateByUser(
  entries: Array<{
    userId: string | null;
    userName: string;
    savedSeconds: number;
    manualEstimatedSeconds: number;
    unitsProcessed: number;
  }>,
) {
  const map = new Map<string, {
    userId: string;
    userName: string;
    executions: number;
    savedSeconds: number;
    manualEstimatedSeconds: number;
    unitsProcessed: number;
  }>();

  for (const item of entries) {
    const userId = item.userId ?? 'unknown';
    const current = map.get(userId) ?? {
      userId,
      userName: item.userName,
      executions: 0,
      savedSeconds: 0,
      manualEstimatedSeconds: 0,
      unitsProcessed: 0,
    };

    current.executions += 1;
    current.savedSeconds += item.savedSeconds;
    current.manualEstimatedSeconds += item.manualEstimatedSeconds;
    current.unitsProcessed += item.unitsProcessed;
    map.set(userId, current);
  }

  return Array.from(map.values()).sort((a, b) => b.savedSeconds - a.savedSeconds);
}

function aggregateTrend(
  entries: Array<{
    createdAt: string;
    savedSeconds: number;
  }>,
) {
  const map = new Map<string, { day: string; savedSeconds: number; executions: number }>();

  for (const item of entries) {
    const day = item.createdAt.slice(0, 10);
    const current = map.get(day) ?? { day, savedSeconds: 0, executions: 0 };
    current.savedSeconds += item.savedSeconds;
    current.executions += 1;
    map.set(day, current);
  }

  return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
}

function buildExecutionScope(user: User): Prisma.ExecutionWhereInput {
  if (isAdmin(user)) {
    return {};
  }

  if (isManager(user)) {
    if (user.departments.length === 0) {
      return { userId: user.id };
    }

    return {
      user: {
        departments: {
          hasSome: user.departments,
        },
      },
    };
  }

  return { userId: user.id };
}
