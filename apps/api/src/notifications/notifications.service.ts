import { Injectable } from '@nestjs/common';
import { Department, RecipientScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        execution: {
          select: {
            id: true,
            status: true,
            robot: { select: { name: true } },
            files: {
              where: { kind: 'output' },
              select: {
                id: true,
                downloadName: true,
                storagePath: true,
                mimeType: true,
                size: true,
              },
            },
          },
        },
      },
    });

    return notifications.map((n) => ({
      ...n,
      execution: n.execution
        ? {
            ...n.execution,
            files: n.execution.files.map((f) => ({
              ...f,
              downloadUrl: `/storage/${f.storagePath}`,
            })),
          }
        : null,
    }));
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createForScheduledTaskExecution(
    executionId: string,
    scheduledTaskId: string,
    status: 'success' | 'error',
    robotName: string,
  ) {
    const task = await this.prisma.scheduledTask.findUnique({
      where: { id: scheduledTaskId },
    });

    if (!task) {
      return;
    }

    let userIds: string[] = [];

    if (task.recipientScope === RecipientScope.all) {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (task.recipientScope === RecipientScope.departments) {
      const depts = task.recipientDepartments as Department[];
      if (depts.length > 0) {
        const users = await this.prisma.user.findMany({
          where: { isActive: true, departments: { hasSome: depts } },
          select: { id: true },
        });
        userIds = users.map((u) => u.id);
      }
    } else {
      userIds = task.recipientUserIds;
    }

    if (userIds.length === 0) {
      return;
    }

    const isSuccess = status === 'success';
    const title = isSuccess
      ? `${robotName}: resultado disponível`
      : `${robotName}: falha na execução`;
    const body = isSuccess
      ? `Agendamento "${task.name}" concluído. Arquivos prontos para download.`
      : `Agendamento "${task.name}" falhou. Verifique os detalhes da execução.`;

    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: isSuccess ? 'execution_result' : 'execution_error',
        title,
        body,
        executionId,
      })),
    });
  }
}
