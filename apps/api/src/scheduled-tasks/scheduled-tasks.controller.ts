import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ScheduledTasksService } from './scheduled-tasks.service';

type UploadedFile = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

@Controller('scheduled-tasks')
export class ScheduledTasksController {
  constructor(
    private readonly scheduledTasksService: ScheduledTasksService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async listTasks(@Req() request: Request) {
    const user = await this.authService.requireUser(request);
    return this.scheduledTasksService.listTasks(user);
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async saveTask(
    @Req() request: Request,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: UploadedFile[] = [],
  ) {
    const user = await this.authService.requireUser(request);
    return this.scheduledTasksService.saveTask(
      user,
      {
        id: typeof body.id === 'string' ? body.id : undefined,
        name: typeof body.name === 'string' ? body.name : undefined,
        robotId: typeof body.robotId === 'string' ? body.robotId : undefined,
        frequency: typeof body.frequency === 'string' ? body.frequency : undefined,
        timeOfDay: typeof body.timeOfDay === 'string' ? body.timeOfDay : undefined,
        startDate: typeof body.startDate === 'string' ? body.startDate : undefined,
        dayOfWeek:
          typeof body.dayOfWeek === 'number'
            ? body.dayOfWeek
            : typeof body.dayOfWeek === 'string' && body.dayOfWeek !== ''
              ? Number(body.dayOfWeek)
              : null,
        dayOfMonth:
          typeof body.dayOfMonth === 'number'
            ? body.dayOfMonth
            : typeof body.dayOfMonth === 'string' && body.dayOfMonth !== ''
              ? Number(body.dayOfMonth)
              : null,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
        parameters: parseParameters(body.parameters),
        isActive: typeof body.isActive === 'boolean' ? body.isActive : String(body.isActive) === 'true',
      },
      files,
    );
  }

  @Delete(':id')
  async deleteTask(@Req() request: Request, @Param('id') id: string) {
    const user = await this.authService.requireUser(request);
    return this.scheduledTasksService.deleteTask(user, id);
  }
}

function parseParameters(value: unknown) {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}
