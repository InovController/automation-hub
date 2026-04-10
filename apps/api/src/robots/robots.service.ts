import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import {
  canAccessExecution,
  canAccessRobot,
  normalizeDepartments,
} from '../shared/access';
import { toUserFileName, uniqueStoredFileName } from '../shared/files';
import {
  ensureRobotExampleDirs,
  executionRoot,
  robotExamplesDir,
  robotRoot,
} from '../shared/storage';

type UploadedFile = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

@Injectable()
export class RobotsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHubOverview(user: User) {
    const [robots, executions] = await Promise.all([
      this.prisma.robot.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        include: {
          inputExamples: {
            orderBy: { createdAt: 'desc' },
          },
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.execution.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          robot: true,
          files: true,
          user: {
            select: {
              id: true,
              departments: true,
            },
          },
        },
      }),
    ]);

    const visibleRobots = robots.filter((robot) => canAccessRobot(user, robot));
    const visibleRobotIds = new Set(visibleRobots.map((robot) => robot.id));
    const visibleExecutions = executions.filter(
      (execution) =>
        visibleRobotIds.has(execution.robotId) && canAccessExecution(user, execution),
    );

    return {
      stats: {
        totalRobots: visibleRobots.length,
        readyRobots: visibleRobots.filter((robot) => robot.isActive).length,
        runningExecutions: visibleExecutions.filter(
          (item) => item.status === 'running',
        ).length,
        successfulExecutions: visibleExecutions.filter(
          (item) => item.status === 'success',
        ).length,
      },
      robots: visibleRobots.map((robot) => ({
        ...robot,
        inputExamples: robot.inputExamples.map((item) => ({
          ...item,
          downloadUrl: `/storage/${item.storagePath}`,
        })),
        lastExecution: robot.executions[0] ?? null,
        executions: undefined,
      })),
      recentExecutions: visibleExecutions,
    };
  }

  async findAll(user: User) {
    const robots = await this.prisma.robot.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        inputExamples: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return robots
      .filter((robot) => canAccessRobot(user, robot))
      .map((robot) => ({
        ...robot,
        inputExamples: robot.inputExamples.map((item) => ({
          ...item,
          downloadUrl: `/storage/${item.storagePath}`,
        })),
      }));
  }

  async findOne(id: string, user: User) {
    const robot = await this.prisma.robot.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            files: true,
            user: {
              select: {
                id: true,
                departments: true,
              },
            },
          },
        },
        inputExamples: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!robot || !canAccessRobot(user, robot)) {
      return null;
    }

    return {
      ...robot,
      executions: robot.executions
        .filter((execution) => canAccessExecution(user, execution))
        .map((execution) => ({
          ...execution,
          files: execution.files.map((file) => ({
            ...file,
            downloadUrl: `/storage/${file.storagePath}`,
          })),
        })),
      inputExamples: robot.inputExamples.map((item) => ({
        ...item,
        downloadUrl: `/storage/${item.storagePath}`,
      })),
    };
  }

  async addInputExample(
    robotId: string,
    input: {
      fileInputName?: string;
      title?: string;
      description?: string;
    },
    file?: UploadedFile,
  ) {
    const robot = await this.prisma.robot.findUnique({
      where: { id: robotId },
      select: { id: true },
    });

    if (!robot) {
      throw new BadRequestException('Automação não encontrada.');
    }

    if (!file?.buffer) {
      throw new BadRequestException('Envie um arquivo de modelo.');
    }

    const originalName = file.originalname?.trim() || 'modelo';
    const storedName = uniqueStoredFileName(originalName);
    const safeOriginalName = toUserFileName(originalName) || storedName;

    await ensureRobotExampleDirs(robot.id);

    const relativeStoragePath = `robots/${robot.id}/examples/${storedName}`;
    const absoluteStoragePath = join(robotExamplesDir(robot.id), storedName);
    await writeFile(absoluteStoragePath, file.buffer);

    const created = await this.prisma.robotInputExample.create({
      data: {
        robotId: robot.id,
        fileInputName: input.fileInputName?.trim() || null,
        title: input.title?.trim() || null,
        description: input.description?.trim() || null,
        filename: storedName,
        storagePath: relativeStoragePath,
        downloadName: safeOriginalName,
        mimeType: file.mimetype || null,
        size: typeof file.size === 'number' ? file.size : null,
      },
    });

    return {
      ...created,
      downloadUrl: `/storage/${created.storagePath}`,
    };
  }

  async removeInputExample(robotId: string, exampleId: string) {
    const item = await this.prisma.robotInputExample.findFirst({
      where: {
        id: exampleId,
        robotId,
      },
    });

    if (!item) {
      throw new BadRequestException('Modelo de entrada não encontrado.');
    }

    await this.prisma.robotInputExample.delete({
      where: { id: item.id },
    });

    await rm(join(process.cwd(), 'storage', item.storagePath), {
      force: true,
    });

    return { success: true };
  }

  async saveRobot(input: RobotUpsertInput) {
    const name = input.name?.trim();
    const slug = normalizeSlug(input.slug || input.name || '');

    if (!name) {
      throw new BadRequestException('Nome da automação é obrigatório.');
    }

    if (!slug) {
      throw new BadRequestException('Slug da automação é obrigatório.');
    }

    const duplicate = await this.prisma.robot.findFirst({
      where: {
        slug,
        NOT: input.id ? { id: input.id } : undefined,
      },
    });

    if (duplicate) {
      throw new BadRequestException('Já existe uma automação com este slug.');
    }

    const payload: Prisma.RobotUncheckedCreateInput = {
      slug,
      name,
      summary: input.summary?.trim() || null,
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      icon: input.icon?.trim() || 'bot',
      isActive: input.isActive ?? true,
      version: input.version?.trim() || '1.0.0',
      estimatedMinutes: input.estimatedMinutes ?? null,
      maxConcurrency: Math.max(1, input.maxConcurrency ?? 1),
      manualSecondsPerUnit: Math.max(0, Math.floor(input.manualSecondsPerUnit ?? 0)),
      unitLabel: input.unitLabel?.trim() || 'item',
      unitMetricKey: normalizeMetricKey(input.unitMetricKey) || 'itens_processados',
      conflictKeys: normalizeConflictKeys(input.conflictKeys),
      command: input.command?.trim() || null,
      workingDirectory: input.workingDirectory?.trim() || null,
      allowedDepartments: normalizeDepartments(input.allowedDepartments),
      schema: (input.schema ?? { fields: [], fileInputs: [] }) as Prisma.InputJsonValue,
      documentationUrl: input.documentationUrl?.trim() || null,
      documentationLabel: input.documentationLabel?.trim() || null,
      supportLabel: input.supportLabel?.trim() || null,
      supportValue: input.supportValue?.trim() || null,
      dataPolicy: input.dataPolicy?.trim() || null,
    };

    if (input.id) {
      return this.prisma.robot.update({
        where: { id: input.id },
        data: payload,
      });
    }

    return this.prisma.robot.create({
      data: payload,
    });
  }

  async deleteRobot(id: string) {
    const robot = await this.prisma.robot.findUnique({
      where: { id },
      include: {
        executions: {
          select: { id: true, status: true },
        },
      },
    });

    if (!robot) {
      throw new BadRequestException('Automação não encontrada.');
    }

    const hasLiveExecution = robot.executions.some(
      (execution) =>
        execution.status === 'queued' || execution.status === 'running',
    );
    if (hasLiveExecution) {
      throw new ConflictException(
        'Não é possível excluir uma automação com execuções em andamento.',
      );
    }

    const executionIds = robot.executions.map((execution) => execution.id);

    await this.prisma.$transaction(async (tx) => {
      if (executionIds.length > 0) {
        await tx.executionLog.deleteMany({
          where: { executionId: { in: executionIds } },
        });
        await tx.executionFile.deleteMany({
          where: { executionId: { in: executionIds } },
        });
        await tx.execution.deleteMany({
          where: { id: { in: executionIds } },
        });
      }

      await tx.robot.delete({
        where: { id },
      });
    });

    await Promise.all(
      executionIds.map(async (executionId) => {
        await rm(executionRoot(executionId), { recursive: true, force: true });
      }),
    );

    await rm(robotRoot(id), { recursive: true, force: true });

    return { success: true };
  }
}

export type RobotUpsertInput = {
  id?: string;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  category?: string;
  icon?: string;
  isActive?: boolean;
  version?: string;
  estimatedMinutes?: number | null;
  maxConcurrency?: number | null;
  manualSecondsPerUnit?: number | null;
  unitLabel?: string;
  unitMetricKey?: string;
  conflictKeys?: string;
  command?: string;
  workingDirectory?: string;
  allowedDepartments?: unknown;
  schema?: Record<string, unknown>;
  documentationUrl?: string;
  documentationLabel?: string;
  supportLabel?: string;
  supportValue?: string;
  dataPolicy?: string;
};

function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeConflictKeys(value?: string) {
  if (!value) {
    return null;
  }

  const tokens = value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return tokens.length > 0 ? Array.from(new Set(tokens)).join(', ') : null;
}

function normalizeMetricKey(value?: string) {
  if (!value) {
    return null;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
