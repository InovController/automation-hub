import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ScheduledTasksService } from './scheduled-tasks.service';

@Injectable()
export class ScheduledTasksSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ScheduledTasksSchedulerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly scheduledTasksService: ScheduledTasksService) {}

  onModuleInit() {
    void this.processDueTasks();
    this.timer = setInterval(() => {
      void this.processDueTasks();
    }, 30000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async processDueTasks() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const tasks = await this.scheduledTasksService.listDueTasks();
      for (const task of tasks) {
        await this.scheduledTasksService.triggerTask(task.id);
      }
    } catch (error) {
      this.logger.error('Falha ao processar agendamentos.', error);
    } finally {
      this.running = false;
    }
  }
}
