import { Body, Controller, Get, HttpException, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }
  entry.count++;
  return true;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      name?: string;
      email?: string;
      password?: string;
      departments?: unknown;
    },
    @Req() request: Request,
  ) {
    const ip = request.ip ?? 'unknown';
    if (!checkRateLimit(ip)) {
      throw new HttpException('Muitas tentativas. Tente novamente em 1 minuto.', 429);
    }
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: { email?: string; password?: string }, @Req() request: Request) {
    const ip = request.ip ?? 'unknown';
    if (!checkRateLimit(ip)) {
      throw new HttpException('Muitas tentativas. Tente novamente em 1 minuto.', 429);
    }
    return this.authService.login(body);
  }

  @Get('me')
  async me(@Req() request: Request) {
    const user = await this.authService.requireUser(request);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departments: user.departments,
    };
  }

  @Post('logout')
  logout(@Req() request: Request) {
    return this.authService.logout(request);
  }
}
