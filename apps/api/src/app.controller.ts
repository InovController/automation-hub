import { Controller, Get, Res } from '@nestjs/common';
import { join } from 'node:path';
import type { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getApp(@Res() response: Response) {
    return response.sendFile(join(process.cwd(), 'public', 'index.html'));
  }
}
