import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ExecutionStatus, Prisma, type User } from '@prisma/client';
import { writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { canAccessExecution, canAccessRobot, isAdmin, isManager } from '../shared/access';
import { toUserFileName, uniqueStoredFileName } from '../shared/files';
import { ensureExecutionDirs, inputDir, storageRoot } from '../shared/storage';

type UploadFile = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

type CreateExecutionInput = {
  userId: string;
  notes?: string;
  priority?: number;
  parameters?: Record<string, unknown>;
  scheduledTaskId?: string;
};

@Injectable()
export class ExecutionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createExecution(
    robotId: string,
    payload: CreateExecutionInput,
    uploadedFiles: UploadFile[],
  ) {
    if (!robotId) {
      throw new BadRequestException('Robot id is required');
    }

    const [robot, user] = await Promise.all([
      this.prisma.robot.findUnique({ where: { id: robotId } }),
      this.prisma.user.findUnique({ where: { id: payload.userId } }),
    ]);

    if (!robot) {
      throw new NotFoundException('Robot not found');
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!canAccessRobot(user, robot)) {
      throw new NotFoundException('Robot not found');
    }

    const execution = await this.prisma.execution.create({
      data: {
        robotId,
        userId: user.id,
        requestedByName: user.name,
        requestedByEmail: user.email,
        notes: payload.notes,
        priority: payload.priority ?? 0,
        inputJson: (payload.parameters ?? {}) as Prisma.InputJsonValue,
        scheduledTaskId: payload.scheduledTaskId,
      },
    });

    await ensureExecutionDirs(execution.id);

    if (uploadedFiles.length > 0) {
      const inputFiles = await Promise.all(
        uploadedFiles.map(async (file) => {
          if (!file.buffer) {
            throw new InternalServerErrorException('Uploaded file buffer is empty');
          }

          const storedName = uniqueStoredFileName(file.originalname ?? 'arquivo');
          const absolutePath = join(inputDir(execution.id), storedName);
          await writeFile(absolutePath, file.buffer);

          const userFileName = toUserFileName(file.originalname ?? storedName);
          return {
            executionId: execution.id,
            kind: 'input',
            filename: storedName,
            originalName: userFileName,
            storagePath: relative(storageRoot, absolutePath).replaceAll('\\', '/'),
            downloadName: userFileName,
            mimeType: file.mimetype,
            size: file.size ?? file.buffer.length,
          };
        }),
      );

      await this.prisma.executionFile.createMany({ data: inputFiles });
    }

    await this.log(execution.id, 'info', 'Execução recebida e colocada na fila.');
    await this.updateProgress(execution.id, 5, 'Aguardando processamento');

    return this.getExecution(execution.id, user);
  }

  async listExecutions(user: User) {
    const where = buildExecutionScope(user);
    const executions = await this.prisma.execution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
      take: 200,
    });

    return executions.filter(
      (execution) =>
        canAccessExecution(user, execution) && canAccessRobot(user, execution.robot),
    );
  }

  async getExecution(id: string, user?: User) {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
      include: {
        robot: true,
        files: { orderBy: { createdAt: 'asc' } },
        logs: { orderBy: { timestamp: 'asc' } },
        user: {
          select: {
            id: true,
            departments: true,
          },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }
    if (
      user &&
      (!canAccessExecution(user, execution) || !canAccessRobot(user, execution.robot))
    ) {
      throw new NotFoundException('Execution not found');
    }

    return {
      ...execution,
      files: execution.files.map((file) => ({
        ...file,
        downloadUrl: `/storage/${file.storagePath}`,
      })),
    };
  }

  async getQueuedExecution() {
    return this.prisma.execution.findFirst({
      where: { status: ExecutionStatus.queued },
      orderBy: { createdAt: 'asc' },
      include: {
        robot: true,
        files: true,
      },
    });
  }

  async listQueuedExecutions(limit = 50) {
    return this.prisma.execution.findMany({
      where: { status: ExecutionStatus.queued },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        robot: true,
        files: true,
      },
      take: limit,
    });
  }

  async listRunningExecutions() {
    return this.prisma.execution.findMany({
      where: { status: ExecutionStatus.running },
      orderBy: { startedAt: 'asc' },
      include: {
        robot: true,
        files: true,
      },
    });
  }

  async getScheduledTaskId(id: string) {
    return this.prisma.execution.findUnique({
      where: { id },
      select: { scheduledTaskId: true },
    });
  }

  async getStatus(id: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    return execution.status;
  }

  async markAsRunning(id: string) {
    return this.prisma.execution.update({
      where: { id },
      data: {
        status: ExecutionStatus.running,
        startedAt: new Date(),
        progress: 15,
        currentStep: 'Inicializando ambiente',
      },
      include: {
        robot: true,
        files: true,
      },
    });
  }

  async markAsSuccess(
    id: string,
    currentStep: string,
    outputZipPath?: string,
    options?: { unitsProcessed?: number | null },
  ) {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
      include: {
        robot: {
          select: {
            manualSecondsPerUnit: true,
          },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    const finishedAt = new Date();
    const unitsProcessed =
      typeof options?.unitsProcessed === 'number' && Number.isFinite(options.unitsProcessed)
        ? Math.max(0, Math.round(options.unitsProcessed))
        : null;
    const manualEstimatedSeconds = calculateManualEstimatedSeconds(
      execution.robot,
      unitsProcessed,
    );
    return this.prisma.execution.update({
      where: { id },
      data: {
        status: ExecutionStatus.success,
        progress: 100,
        currentStep,
        finishedAt,
        outputZipPath,
        unitsProcessed,
        manualEstimatedSeconds,
      },
    });
  }

  async markAsError(id: string, message: string) {
    return this.prisma.execution.update({
      where: { id },
      data: {
        status: ExecutionStatus.error,
        errorMessage: message,
        currentStep: 'Falha na execução',
        finishedAt: new Date(),
      },
    });
  }

  async cancel(id: string, user: User) {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
      include: {
        robot: true,
        user: {
          select: {
            id: true,
            departments: true,
          },
        },
      },
    });
    if (
      !execution ||
      !canAccessExecution(user, execution) ||
      !canAccessRobot(user, execution.robot)
    ) {
      throw new NotFoundException('Execution not found');
    }

    return this.prisma.execution.update({
      where: { id },
      data: {
        status: ExecutionStatus.canceled,
        canceledAt: new Date(),
        finishedAt: new Date(),
        currentStep: 'Cancelado pelo usuário',
      },
    });
  }

  async updateProgress(id: string, progress: number, currentStep: string) {
    return this.prisma.execution.update({
      where: { id },
      data: { progress, currentStep },
    });
  }

  async updateQueueReason(id: string, currentStep: string) {
    return this.prisma.execution.update({
      where: { id },
      data: {
        currentStep,
        progress: 5,
      },
    });
  }

  async log(executionId: string, level: string, message: string) {
    return this.prisma.executionLog.create({
      data: {
        executionId,
        level,
        message,
      },
    });
  }

  async registerOutputFile(input: {
    executionId: string;
    kind: string;
    filename: string;
    originalName?: string;
    storagePath: string;
    downloadName?: string;
    mimeType?: string;
    size?: number;
  }) {
    return this.prisma.executionFile.create({
      data: input,
    });
  }
}

function buildExecutionScope(user: User): Prisma.ExecutionWhereInput | undefined {
  if (isAdmin(user)) {
    return undefined;
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

function calculateManualEstimatedSeconds(
  robot: {
    manualSecondsPerUnit: number;
  },
  unitsProcessed: number | null,
) {
  const unitSeconds = Math.max(0, robot.manualSecondsPerUnit || 0);
  const units =
    unitsProcessed === null || unitsProcessed === undefined
      ? 1
      : Math.max(0, unitsProcessed);

  return unitSeconds * units;
}
