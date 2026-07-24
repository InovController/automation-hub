import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ExecutionIdentitiesService } from '../execution-identities/execution-identities.service';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeDepartments } from '../shared/access';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identities: ExecutionIdentitiesService,
  ) {}

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

    // Não deixa rebaixar/desativar o último admin ativo — seria lockout
    // permanente do painel de administração
    const losesAdminAccess =
      user.role === UserRole.admin &&
      user.isActive &&
      (role !== UserRole.admin || !isActive);
    if (losesAdminAccess) {
      const activeAdmins = await this.prisma.user.count({
        where: { role: UserRole.admin, isActive: true },
      });
      if (activeAdmins <= 1) {
        throw new BadRequestException(
          'Este é o último administrador ativo. Promova outro usuário antes de rebaixá-lo ou desativá-lo.',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
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

    await this.identities.reconcileUser(updatedUser.id);
    return updatedUser;
  }

  listUnlinkedIdentities() {
    return this.identities.listUnlinkedIdentities();
  }

  linkUnlinkedIdentity(input: { login?: unknown; userId?: unknown }) {
    const login = typeof input.login === 'string' ? input.login : '';
    const userId = typeof input.userId === 'string' ? input.userId : '';
    return this.identities.linkIdentity(login, userId);
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
