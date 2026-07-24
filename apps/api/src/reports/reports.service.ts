import { Injectable } from '@nestjs/common';
import { ExecutionStatus, Prisma, type User } from '@prisma/client';
import {
  buildExecutionScope,
  canAccessExecution,
  canAccessRobot,
} from '../shared/access';
import { PrismaService } from '../prisma/prisma.service';

type QueryInput = {
  from?: string;
  to?: string;
  robotId?: string;
  userId?: string;
};

type NormalizedEntry = {
  id: string;
  createdAt: string;
  robotId: string;
  robotName: string;
  userId: string | null;
  userName: string;
  unitsProcessed: number;
  unitLabel: string;
  manualEstimatedSeconds: number;
  savedSeconds: number;
};

const PAGE_SIZE = 1000;
const RECENT_LIMIT = 300;
const EXTERNAL_USER_FILTER_PREFIX = 'external:';
const REPORT_TIME_ZONE_OFFSET = '-03:00';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeSavingsReport(user: User, query: QueryInput) {
    const finishedAtFilter: Prisma.DateTimeFilter = {};
    const createdAtFallbackFilter: Prisma.DateTimeFilter = {};
    const fromDate = parseDateBoundary(query.from, 'start');
    const toDate = parseDateBoundary(query.to, 'end');

    if (fromDate) {
      finishedAtFilter.gte = fromDate;
      createdAtFallbackFilter.gte = fromDate;
    }
    if (toDate) {
      finishedAtFilter.lte = toDate;
      createdAtFallbackFilter.lte = toDate;
    }

    const periodFilter: Prisma.ExecutionWhereInput | undefined =
      Object.keys(finishedAtFilter).length > 0
        ? {
            OR: [
              { finishedAt: finishedAtFilter },
              {
                AND: [
                  { finishedAt: null },
                  { createdAt: createdAtFallbackFilter },
                ],
              },
            ],
          }
        : undefined;

    // Pre-load credit settings and user names for attribution
    const [creditTasks, allUsers, externalIdentities] = await Promise.all([
      this.prisma.scheduledTask.findMany({
        where: { creditMode: { not: 'creator' } },
        select: { id: true, creditMode: true, creditUserIds: true, creditDepartment: true },
      }),
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          athenasLogin: true,
          departments: true,
        },
      }),
      this.prisma.externalIdentity.findMany(),
    ]);
    const creditMap = new Map(creditTasks.map((t) => [t.id, t]));
    const userNameMap = new Map(allUsers.map((u) => [u.id, u]));
    const externalLoginMap = new Map<string, (typeof allUsers)[number]>();
    const externalIdentityMap = new Map(
      externalIdentities.map((identity) => [identity.login, identity]),
    );
    for (const reportUser of allUsers) {
      if (reportUser.athenasLogin) {
        externalLoginMap.set(normalizeExternalIdentity(reportUser.athenasLogin), reportUser);
      }
      externalLoginMap.set(normalizeExternalIdentity(reportUser.email), reportUser);
    }

    const where: Prisma.ExecutionWhereInput = {
      status: ExecutionStatus.success,
      ...(periodFilter ?? {}),
      ...(query.robotId ? { robotId: query.robotId } : {}),
      ...(query.userId ? buildUserFilter(query.userId, userNameMap.get(query.userId)) : {}),
      ...(buildExecutionScope(user) ?? {}),
    };

    const totals = {
      executions: 0,
      savedSeconds: 0,
      manualEstimatedSeconds: 0,
      unitsProcessed: 0,
    };
    const byRobotMap = new Map<string, AggregateRow & { robotId: string; robotName: string }>();
    const byUserMap = new Map<string, AggregateRow & { userId: string; userName: string }>();
    const byDepartmentMap = new Map<string, AggregateRow & { department: string }>();
    const trendMap = new Map<string, { day: string; savedSeconds: number; executions: number }>();
    const recent: NormalizedEntry[] = [];

    // Percorre tudo em lotes: um take fixo subestimava silenciosamente os
    // totais apresentados à diretoria quando o histórico crescia
    let cursor: string | undefined;
    while (true) {
      const batch = await this.prisma.execution.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          createdAt: true,
          finishedAt: true,
          robotId: true,
          userId: true,
          scheduledTaskId: true,
          unitsProcessed: true,
          manualEstimatedSeconds: true,
          requestedByName: true,
          requestedByEmail: true,
          robot: {
            select: {
              name: true,
              unitLabel: true,
              manualSecondsPerUnit: true,
              allowedDepartments: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              departments: true,
            },
          },
        },
      });

      if (batch.length === 0) {
        break;
      }

      for (const execution of batch) {
        if (
          !canAccessExecution(user, execution) ||
          !canAccessRobot(user, execution.robot)
        ) {
          continue;
        }

        const units = resolveUnitsProcessed(execution.unitsProcessed);
        const manualEstimatedSeconds =
          execution.manualEstimatedSeconds ??
          calculateManualEstimatedSeconds(execution.robot, units);
        const externalLogin = normalizeExternalIdentity(
          execution.requestedByEmail ?? execution.requestedByName ?? '',
        );
        const attributedUser =
          execution.user ??
          externalLoginMap.get(externalLogin);
        const externalIdentity = externalIdentityMap.get(externalLogin);

        const item: NormalizedEntry = {
          id: execution.id,
          createdAt: (execution.finishedAt ?? execution.createdAt).toISOString(),
          robotId: execution.robotId,
          robotName: execution.robot.name,
          userId: execution.userId ?? attributedUser?.id ?? null,
          userName:
            attributedUser?.name ||
            externalIdentity?.name ||
            execution.requestedByName ||
            execution.requestedByEmail ||
            'Usuário',
          unitsProcessed: units,
          unitLabel: execution.robot.unitLabel || 'item',
          manualEstimatedSeconds,
          savedSeconds: manualEstimatedSeconds,
        };

        totals.executions += 1;
        totals.savedSeconds += item.savedSeconds;
        totals.manualEstimatedSeconds += item.manualEstimatedSeconds;
        totals.unitsProcessed += item.unitsProcessed;

        accumulate(byRobotMap, item.robotId, { robotId: item.robotId, robotName: item.robotName }, item);

        const credit = execution.scheduledTaskId ? creditMap.get(execution.scheduledTaskId) : null;

        if (credit?.creditMode === 'users' && credit.creditUserIds.length > 0) {
          const share = 1 / credit.creditUserIds.length;
          const splitItem = {
            ...item,
            savedSeconds: item.savedSeconds * share,
            manualEstimatedSeconds: item.manualEstimatedSeconds * share,
            unitsProcessed: item.unitsProcessed * share,
          };
          for (const uid of credit.creditUserIds) {
            const u = userNameMap.get(uid);
            accumulate(byUserMap, uid, { userId: uid, userName: u?.name ?? 'Usuário' }, splitItem);
            const dept = u?.departments?.[0] ?? 'outros';
            accumulate(byDepartmentMap, dept, { department: dept }, splitItem);
          }
        } else if (credit?.creditMode === 'department' && credit.creditDepartment) {
          accumulate(byDepartmentMap, credit.creditDepartment, { department: credit.creditDepartment }, item);
        } else {
          const reportUserId =
            item.userId ?? externalUserFilterId(externalLogin || item.userName);
          accumulate(byUserMap, reportUserId, { userId: reportUserId, userName: item.userName }, item);
          const dept =
            attributedUser?.departments?.[0] ??
            externalIdentity?.department ??
            'outros';
          accumulate(byDepartmentMap, dept, { department: dept }, item);
        }

        const day = item.createdAt.slice(0, 10);
        const trendRow = trendMap.get(day) ?? { day, savedSeconds: 0, executions: 0 };
        trendRow.savedSeconds += item.savedSeconds;
        trendRow.executions += 1;
        trendMap.set(day, trendRow);

        if (recent.length < RECENT_LIMIT) {
          recent.push(item);
        }
      }

      if (batch.length < PAGE_SIZE) {
        break;
      }
      cursor = batch[batch.length - 1].id;
    }

    return {
      totals,
      byRobot: Array.from(byRobotMap.values()).sort((a, b) => b.savedSeconds - a.savedSeconds),
      byUser: Array.from(byUserMap.values()).sort((a, b) => b.savedSeconds - a.savedSeconds),
      byDepartment: Array.from(byDepartmentMap.values()).sort((a, b) => b.savedSeconds - a.savedSeconds),
      trend: Array.from(trendMap.values()).sort((a, b) => a.day.localeCompare(b.day)),
      executions: recent,
    };
  }
}

type AggregateRow = {
  executions: number;
  savedSeconds: number;
  manualEstimatedSeconds: number;
  unitsProcessed: number;
};

function accumulate<T extends Record<string, unknown>>(
  map: Map<string, AggregateRow & T>,
  key: string,
  identity: T,
  item: {
    savedSeconds: number;
    manualEstimatedSeconds: number;
    unitsProcessed: number;
  },
) {
  const current =
    map.get(key) ??
    ({
      ...identity,
      executions: 0,
      savedSeconds: 0,
      manualEstimatedSeconds: 0,
      unitsProcessed: 0,
    } as AggregateRow & T);

  current.executions += 1;
  current.savedSeconds += item.savedSeconds;
  current.manualEstimatedSeconds += item.manualEstimatedSeconds;
  current.unitsProcessed += item.unitsProcessed;
  map.set(key, current);
}

function parseDateBoundary(value: string | undefined, boundary: 'start' | 'end') {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsed = dateOnlyMatch
    ? new Date(
        `${value}T${boundary === 'start' ? '00:00:00.000' : '23:59:59.999'}${REPORT_TIME_ZONE_OFFSET}`,
      )
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function externalUserFilterId(userName: string) {
  return `${EXTERNAL_USER_FILTER_PREFIX}${userName.trim().toLocaleLowerCase('pt-BR')}`;
}

function buildUserFilter(
  userFilterId: string,
  reportUser?: { athenasLogin: string | null; email: string },
): Prisma.ExecutionWhereInput {
  if (!userFilterId.startsWith(EXTERNAL_USER_FILTER_PREFIX)) {
    const externalAliases = [reportUser?.athenasLogin, reportUser?.email].filter(
      (value): value is string => Boolean(value),
    );

    if (externalAliases.length === 0) {
      return { userId: userFilterId };
    }

    return {
      AND: [
        {
          OR: [
            { userId: userFilterId },
            {
              AND: [
                { userId: null },
                {
                  OR: externalAliases.flatMap((alias) => [
                    { requestedByName: { equals: alias, mode: 'insensitive' as const } },
                    { requestedByEmail: { equals: alias, mode: 'insensitive' as const } },
                  ]),
                },
              ],
            },
          ],
        },
      ],
    };
  }

  const externalLogin = userFilterId.slice(EXTERNAL_USER_FILTER_PREFIX.length).trim();

  // Execucoes externas cujo login ainda nao corresponde a um usuario do hub
  // possuem userId nulo. O identificador virtual usado pelo relatorio permite
  // filtra-las pelo login que veio na API, sem consultar um userId inexistente.
  return {
    AND: [
      { userId: null },
      {
        OR: [
          { requestedByName: { equals: externalLogin, mode: 'insensitive' } },
          { requestedByEmail: { equals: externalLogin, mode: 'insensitive' } },
        ],
      },
    ],
  };
}

function normalizeExternalIdentity(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR');
}
