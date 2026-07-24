import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureAdminBootstrap();
  }

  private async ensureAdminBootstrap() {
    // Considera apenas admins ativos: um admin desativado não pode ser a
    // razão de ninguém ser promovido (lockout permanente).
    const adminCount = await this.prisma.user.count({
      where: { role: UserRole.admin, isActive: true },
    });

    if (adminCount > 0) {
      return;
    }

    const firstUser = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!firstUser) {
      return;
    }

    await this.prisma.user.update({
      where: { id: firstUser.id },
      data: {
        role: UserRole.admin,
        isActive: true,
        departments: firstUser.departments,
      },
    });

    this.logger.warn(`Promoted ${firstUser.email} to admin to bootstrap access control.`);
  }
}
