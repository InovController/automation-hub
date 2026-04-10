import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeDepartments } from '../shared/access';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departments: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateUser(
    id: string,
    input: { role?: unknown; departments?: unknown; isActive?: unknown },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const role = parseRole(input.role) ?? user.role;
    const departments =
      input.departments === undefined
        ? user.departments
        : normalizeDepartments(input.departments);
    const isActive =
      typeof input.isActive === 'boolean' ? input.isActive : user.isActive;

    if (departments.length === 0) {
      throw new BadRequestException('Selecione pelo menos um departamento.');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        role,
        departments,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departments: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}

function parseRole(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  return Object.values(UserRole).includes(value as UserRole)
    ? (value as UserRole)
    : null;
}
