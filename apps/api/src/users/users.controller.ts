import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async listUsers(@Req() request: Request) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);
    return this.usersService.listUsers();
  }

  @Get('unlinked-identities')
  async listUnlinkedIdentities(@Req() request: Request) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);
    return this.usersService.listUnlinkedIdentities();
  }

  @Post('unlinked-identities/link')
  async linkUnlinkedIdentity(
    @Body() body: { login?: unknown; userId?: unknown },
    @Req() request: Request,
  ) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);
    return this.usersService.linkUnlinkedIdentity(body);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { role?: unknown; departments?: unknown; isActive?: unknown },
    @Req() request: Request,
  ) {
    const user = await this.authService.requireUser(request);
    this.authService.ensureAdmin(user);
    return this.usersService.updateUser(id, body);
  }
}
