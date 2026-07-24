import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ExecutionStatus } from '@prisma/client';
import { rm } from 'node:fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { executionRoot } from '../shared/storage';

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

@Injectable()
export class RetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetentionService.name);
  private timer?: NodeJS.Timeout;
  private isSweeping = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Primeiro sweep 1min após o boot para não competir com a inicialização
    this.timer = setInterval(() => void this.sweep(), SWEEP_INTERVAL_MS);
    setTimeout(() => void this.sweep(), 60 * 1000).unref?.();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async sweep() {
    if (this.isSweeping) {
      return;
    }

    this.isSweeping = true;
    try {
      await this.purgeExpiredSessions();
      await this.cleanOldExecutions();
    } catch (error) {
      this.logger.error('Retention sweep failed', error);
    } finally {
      this.isSweeping = false;
    }
  }

  private async purgeExpiredSessions() {
    const { count } = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) {
      this.logger.log(`Sessões expiradas removidas: ${count}`);
    }
  }

  private async cleanOldExecutions() {
    const retentionDays = getRetentionDays();
    if (retentionDays <= 0) {
      return;
    }

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Loop em lotes até não sobrar execução antiga por limpar
    while (true) {
      const executions = await this.prisma.execution.findMany({
        where: {
          cleanedAt: null,
          finishedAt: { lt: cutoff },
          status: {
            in: [ExecutionStatus.success, ExecutionStatus.error, ExecutionStatus.canceled],
          },
        },
        select: { id: true },
        take: BATCH_SIZE,
      });

      if (executions.length === 0) {
        return;
      }

      for (const execution of executions) {
        await rm(executionRoot(execution.id), { recursive: true, force: true });
        await this.prisma.$transaction([
          this.prisma.executionLog.deleteMany({ where: { executionId: execution.id } }),
          this.prisma.executionFile.deleteMany({ where: { executionId: execution.id } }),
          this.prisma.execution.update({
            where: { id: execution.id },
            data: { cleanedAt: new Date() },
          }),
        ]);
      }

      this.logger.log(
        `Retenção: ${executions.length} execução(ões) com mais de ${retentionDays} dia(s) limpas (arquivos e logs removidos).`,
      );
    }
  }
}

function getRetentionDays() {
  const raw = Number(process.env.EXECUTION_RETENTION_DAYS ?? 30);
  return Number.isFinite(raw) ? Math.floor(raw) : 30;
}
