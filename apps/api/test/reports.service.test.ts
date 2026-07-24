import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionStatus, UserRole } from '@prisma/client';
import { ReportsService } from '../src/reports/reports.service';
import { formatAthenasPersonName } from '../src/shared/athenas-identity';

const admin = {
  id: 'admin-1',
  role: UserRole.admin,
  departments: [],
};

function externalExecution(id: string, login: string) {
  const now = new Date('2026-07-22T12:00:00.000Z');
  return {
    id,
    createdAt: now,
    finishedAt: now,
    robotId: 'robot-1',
    userId: null,
    scheduledTaskId: null,
    unitsProcessed: null,
    manualEstimatedSeconds: 600,
    requestedByName: login,
    requestedByEmail: null,
    robot: {
      name: 'Robo externo',
      unitLabel: 'item',
      manualSecondsPerUnit: 0,
      allowedDepartments: [],
    },
    user: null,
  };
}

function createService(
  executions: ReturnType<typeof externalExecution>[],
  users: Array<{
    id: string;
    name: string;
    email: string;
    athenasLogin: string | null;
    departments: string[];
  }> = [],
  athenasNames: Record<string, string> = {},
) {
  let executionQuery: Record<string, unknown> | undefined;
  let page = 0;
  const prisma = {
    scheduledTask: { findMany: async () => [] },
    user: { findMany: async () => users },
    externalIdentity: {
      findMany: async () =>
        Object.entries(athenasNames).map(([login, name]) => ({
          login,
          name: formatAthenasPersonName(name),
          department: login.endsWith('.decon') ? 'contabil' : null,
        })),
    },
    execution: {
      findMany: async (query: Record<string, unknown>) => {
        executionQuery = query;
        return page++ === 0 ? executions : [];
      },
    },
  };

  return {
    service: new ReportsService(prisma as never),
    getExecutionQuery: () => executionQuery,
  };
}

test('separa colaboradores externos sem userId no relatorio', async () => {
  const { service } = createService([
    externalExecution('execution-1', 'maria.silva'),
    externalExecution('execution-2', 'joao.souza'),
  ]);

  const report = await service.getTimeSavingsReport(admin as never, {});

  assert.deepEqual(
    report.byUser.map((item) => [item.userId, item.userName]),
    [
      ['external:maria.silva', 'maria.silva'],
      ['external:joao.souza', 'joao.souza'],
    ],
  );
});

test('usa userLogin como identidade e userName apenas para apresentação', async () => {
  const execution = {
    ...externalExecution('execution-1', 'Tainá de Sousa'),
    requestedByEmail: 'taina.decon',
  };
  const { service } = createService([execution]);

  const report = await service.getTimeSavingsReport(admin as never, {});

  assert.deepEqual(
    report.byUser.map((item) => [item.userId, item.userName]),
    [['external:taina.decon', 'Tainá de Sousa']],
  );
});

test('usa nome e departamento do Athenas para identidade externa sem conta', async () => {
  const { service } = createService(
    [externalExecution('execution-1', 'taina.decon')],
    [],
    { 'taina.decon': 'TAINÁ DE SOUSA' },
  );

  const report = await service.getTimeSavingsReport(admin as never, {});

  assert.deepEqual(
    report.byUser.map((item) => [item.userId, item.userName]),
    [['external:taina.decon', 'Tainá de Sousa']],
  );
  assert.deepEqual(
    report.byDepartment.map((item) => item.department),
    ['contabil'],
  );
});

test('traduz o filtro virtual externo para o login recebido pela API', async () => {
  const { service, getExecutionQuery } = createService([
    externalExecution('execution-1', 'maria.silva'),
  ]);

  await service.getTimeSavingsReport(admin as never, {
    userId: 'external:maria.silva',
  });

  assert.deepEqual(getExecutionQuery()?.where, {
    status: ExecutionStatus.success,
    AND: [
      { userId: null },
      {
        OR: [
          { requestedByName: { equals: 'maria.silva', mode: 'insensitive' } },
          { requestedByEmail: { equals: 'maria.silva', mode: 'insensitive' } },
        ],
      },
    ],
  });
});

test('atribui execucoes externas antigas pelo login Athenas do usuario', async () => {
  const witney = {
    id: 'user-witney',
    name: 'Witney Christian Sousa Da Silva',
    email: 'witney.decon@athenas.local',
    athenasLogin: 'WITNEY.DECON',
    departments: ['contabil'],
  };
  const { service } = createService(
    [externalExecution('execution-legacy', 'WITNEY.DECON')],
    [witney],
  );

  const report = await service.getTimeSavingsReport(admin as never, {});

  assert.deepEqual(report.byUser.map((item) => [item.userId, item.userName]), [
    [witney.id, witney.name],
  ]);
  assert.equal(report.executions[0].userId, witney.id);
  assert.equal(report.byDepartment[0].department, 'contabil');
});

test('filtro de usuario inclui execucoes externas antigas pelo login Athenas', async () => {
  const witney = {
    id: 'user-witney',
    name: 'Witney Christian Sousa Da Silva',
    email: 'witney.decon@athenas.local',
    athenasLogin: 'WITNEY.DECON',
    departments: ['contabil'],
  };
  const { service, getExecutionQuery } = createService(
    [externalExecution('execution-legacy', 'WITNEY.DECON')],
    [witney],
  );

  await service.getTimeSavingsReport(admin as never, { userId: witney.id });

  assert.deepEqual(getExecutionQuery()?.where, {
    status: ExecutionStatus.success,
    AND: [
      {
        OR: [
          { userId: witney.id },
          {
            AND: [
              { userId: null },
              {
                OR: [
                  { requestedByName: { equals: witney.athenasLogin, mode: 'insensitive' } },
                  { requestedByEmail: { equals: witney.athenasLogin, mode: 'insensitive' } },
                  { requestedByName: { equals: witney.email, mode: 'insensitive' } },
                  { requestedByEmail: { equals: witney.email, mode: 'insensitive' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
});

test('filtro de data cobre o dia inteiro no horario de Sao Paulo', async () => {
  const { service, getExecutionQuery } = createService([
    externalExecution('execution-evening', 'WITNEY.DECON'),
  ]);

  await service.getTimeSavingsReport(admin as never, {
    from: '2026-07-22',
    to: '2026-07-22',
  });

  assert.deepEqual(getExecutionQuery()?.where, {
    status: ExecutionStatus.success,
    OR: [
      {
        finishedAt: {
          gte: new Date('2026-07-22T03:00:00.000Z'),
          lte: new Date('2026-07-23T02:59:59.999Z'),
        },
      },
      {
        AND: [
          { finishedAt: null },
          {
            createdAt: {
              gte: new Date('2026-07-22T03:00:00.000Z'),
              lte: new Date('2026-07-23T02:59:59.999Z'),
            },
          },
        ],
      },
    ],
  });
});
