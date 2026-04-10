import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeDepartments } from '../shared/access';

const SESSION_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: {
    name?: string;
    email?: string;
    password?: string;
    departments?: unknown;
  }) {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    const password = input.password?.trim();
    const departments = normalizeDepartments(input.departments);

    if (!name || !email || !password) {
      throw new BadRequestException('Nome, email e senha são obrigatórios.');
    }

    if (password.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres.');
    }

    if (departments.length === 0) {
      throw new BadRequestException('Selecione pelo menos um departamento.');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Já existe uma conta com este email.');
    }

    const userCount = await this.prisma.user.count();

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: userCount === 0 ? UserRole.admin : UserRole.employee,
        departments,
      },
    });

    return this.createSession(user.id);
  }

  async login(input: { email?: string; password?: string }) {
    const email = input.email?.trim().toLowerCase();
    const password = input.password?.trim();

    if (!email || !password) {
      throw new BadRequestException('Email e senha são obrigatórios.');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash) || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.createSession(user.id);
  }

  async logout(request: Request) {
    const token = extractBearerToken(request);
    if (!token) {
      return { success: true };
    }

    await this.prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });

    return { success: true };
  }

  async requireUser(request: Request) {
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Sessão não encontrada.');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: hashToken(token),
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session || !session.user.isActive) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    return session.user;
  }

  ensureAdmin(user: { role: UserRole }) {
    if (user.role !== UserRole.admin) {
      throw new ForbiddenException('Apenas administradores podem executar esta ação.');
    }
  }

  private async createSession(userId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

    const session = await this.prisma.session.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt,
      },
      include: {
        user: true,
      },
    });

    return {
      token,
      user: sanitizeUser(session.user),
    };
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const incomingHash = scryptSync(password, salt, 64);
  const existingHash = Buffer.from(hash, 'hex');

  return (
    incomingHash.length === existingHash.length &&
    timingSafeEqual(incomingHash, existingHash)
  );
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function extractBearerToken(request: Request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
}

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departments: string[];
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departments: user.departments,
  };
}
