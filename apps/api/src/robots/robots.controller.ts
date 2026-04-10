import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { RobotsService } from './robots.service';

type UploadedFile = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

@Controller('robots')
export class RobotsController {
  constructor(
    private readonly robotsService: RobotsService,
    private readonly authService: AuthService,
  ) {}

  @Get('hub')
  async getHubOverview(@Req() request: Request) {
    const user = await this.authService.requireUser(request);
    return this.robotsService.getHubOverview(user);
  }

  @Get()
  async findAll(@Req() request: Request) {
    const user = await this.authService.requireUser(request);
    return this.robotsService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() request: Request) {
    const user = await this.authService.requireUser(request);
    const robot = await this.robotsService.findOne(id, user);
    if (!robot) {
      throw new NotFoundException('Automação não encontrada.');
    }

    return robot;
  }

  @Post()
  async saveRobot(
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);

    return this.robotsService.saveRobot({
      id: typeof body.id === 'string' ? body.id : undefined,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      name: typeof body.name === 'string' ? body.name : undefined,
      summary: typeof body.summary === 'string' ? body.summary : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
      icon: typeof body.icon === 'string' ? body.icon : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
      version: typeof body.version === 'string' ? body.version : undefined,
      estimatedMinutes:
        typeof body.estimatedMinutes === 'number'
          ? body.estimatedMinutes
          : typeof body.estimatedMinutes === 'string' && body.estimatedMinutes
            ? Number(body.estimatedMinutes)
            : null,
      maxConcurrency:
        typeof body.maxConcurrency === 'number'
          ? body.maxConcurrency
          : typeof body.maxConcurrency === 'string' && body.maxConcurrency
            ? Number(body.maxConcurrency)
            : null,
      manualSecondsPerUnit:
        typeof body.manualSecondsPerUnit === 'number'
          ? body.manualSecondsPerUnit
          : typeof body.manualSecondsPerUnit === 'string' &&
              body.manualSecondsPerUnit
            ? Number(body.manualSecondsPerUnit)
            : null,
      unitLabel:
        typeof body.unitLabel === 'string' ? body.unitLabel : undefined,
      unitMetricKey:
        typeof body.unitMetricKey === 'string' ? body.unitMetricKey : undefined,
      conflictKeys:
        typeof body.conflictKeys === 'string' ? body.conflictKeys : undefined,
      command: typeof body.command === 'string' ? body.command : undefined,
      workingDirectory:
        typeof body.workingDirectory === 'string'
          ? body.workingDirectory
          : undefined,
      allowedDepartments: body.allowedDepartments,
      schema:
        body.schema && typeof body.schema === 'object'
          ? (body.schema as Record<string, unknown>)
          : undefined,
      documentationUrl:
        typeof body.documentationUrl === 'string'
          ? body.documentationUrl
          : undefined,
      documentationLabel:
        typeof body.documentationLabel === 'string'
          ? body.documentationLabel
          : undefined,
      supportLabel:
        typeof body.supportLabel === 'string' ? body.supportLabel : undefined,
      supportValue:
        typeof body.supportValue === 'string' ? body.supportValue : undefined,
      dataPolicy:
        typeof body.dataPolicy === 'string' ? body.dataPolicy : undefined,
    });
  }

  @Post(':id/examples')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadInputExample(
    @Param('id') id: string,
    @Req() request: Request,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: UploadedFile[] = [],
  ) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);

    return this.robotsService.addInputExample(
      id,
      {
        fileInputName:
          typeof body.fileInputName === 'string' ? body.fileInputName : undefined,
        title: typeof body.title === 'string' ? body.title : undefined,
        description:
          typeof body.description === 'string' ? body.description : undefined,
      },
      files[0],
    );
  }

  @Post(':id/scripts')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadScript(
    @Param('id') id: string,
    @Req() request: Request,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: UploadedFile[] = [],
  ) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);

    return this.robotsService.uploadScript(
      id,
      typeof body.entryScript === 'string' ? body.entryScript : '',
      files[0],
    );
  }

  @Delete(':id/examples/:exampleId')
  async deleteInputExample(
    @Param('id') id: string,
    @Param('exampleId') exampleId: string,
    @Req() request: Request,
  ) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);
    return this.robotsService.removeInputExample(id, exampleId);
  }

  @Delete(':id')
  async deleteRobot(@Param('id') id: string, @Req() request: Request) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);
    return this.robotsService.deleteRobot(id);
  }
}
