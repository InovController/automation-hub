import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { COMPANY_DEPARTMENTS } from './shared/access';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureAdminBootstrap();
  }

  private async ensureAdminBootstrap() {
    const adminCount = await this.prisma.user.count({
      where: { role: UserRole.admin },
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
        departments:
          firstUser.departments.length > 0
            ? firstUser.departments
            : COMPANY_DEPARTMENTS,
      },
    });

    this.logger.warn(`Promoted ${firstUser.email} to admin to bootstrap access control.`);
  }
}
