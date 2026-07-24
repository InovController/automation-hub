import assert from 'node:assert/strict';
import test from 'node:test';
import { IntegrationsService } from '../src/integrations/integrations.service';

test('integração armazena userName para exibição e userLogin como identidade', async () => {
  let createData: Record<string, unknown> | undefined;
  const prisma = {
    externalIdentity: {
      findUnique: async () => null,
      upsert: async ({
        create,
      }: {
        create: { login: string; name: string; department: string | null };
      }) => create,
    },
    execution: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createData = data;
        return { id: 'execution-1', ...data };
      },
    },
    executionLog: { create: async () => ({ id: 'log-1' }) },
  };
  const identities = {
    findUserByLogin: async () => null,
  };
  const athenas = {
    findActiveUserName: async () => 'TAINÁ DE SOUSA',
  };
  const service = new IntegrationsService(
    prisma as never,
    identities as never,
    athenas as never,
  );

  await service.ingestTimeSavings(
    { id: 'robot-1' } as never,
    {
      secondsSaved: 120,
      userName: 'Tainá de Sousa',
      userLogin: ' Taina.Decon ',
      externalId: 'external-1',
    },
  );

  assert.equal(createData?.requestedByName, 'Tainá de Sousa');
  assert.equal(createData?.requestedByEmail, 'taina.decon');
  assert.equal(createData?.userId, null);
  assert.equal(createData?.externalId, 'external-1');
  assert.equal(createData?.manualEstimatedSeconds, 120);
});
