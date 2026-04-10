import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly authService: AuthService,
  ) {}

  @Get('time-savings')
  async getTimeSavings(
    @Req() request: Request,
    @Query() query: Record<string, string | undefined>,
  ) {
    const user = await this.authService.requireUser(request);
    return this.reportsService.getTimeSavingsReport(user, {
      from: query.from,
      to: query.to,
      robotId: query.robotId,
      userId: query.userId,
    });
  }
}

