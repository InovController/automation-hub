import {
  Body,
  Controller,
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
import { ExecutionRunnerService } from './execution-runner.service';
import { ExecutionsService } from './executions.service';

type UploadedFile = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

@Controller('executions')
export class ExecutionsController {
  constructor(
    private readonly executionsService: ExecutionsService,
    private readonly executionRunnerService: ExecutionRunnerService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async listExecutions(@Req() request: Request) {
    const user = await this.authService.requireUser(request);
    return this.executionsService.listExecutions(user);
  }

  @Get(':id')
  async getExecution(@Param('id') id: string, @Req() request: Request) {
    const user = await this.authService.requireUser(request);
    return this.executionsService.getExecution(id, user);
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async createExecution(
    @Req() request: Request,
    @Body() body: Record<string, string | undefined>,
    @UploadedFiles() files: UploadedFile[] = [],
  ) {
    const user = await this.authService.requireUser(request);
    const parameters = parseParameters(body.parameters);

    return this.executionsService.createExecution(
      body.robotId ?? '',
      {
        userId: user.id,
        notes: body.notes,
        priority: Number(body.priority ?? 0),
        parameters,
      },
      files,
    );
  }

  @Post(':id/cancel')
  async cancelExecution(@Param('id') id: string, @Req() request: Request) {
    const user = await this.authService.requireUser(request);
    const execution = await this.executionsService.cancel(id, user);
    await this.executionRunnerService.stopExecution(id);
    await this.executionsService.log(id, 'warn', 'Execução cancelada pelo usuário.');
    return execution;
  }
}

function parseParameters(parametersJson?: string) {
  if (!parametersJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(parametersJson) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
