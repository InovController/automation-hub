import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Site, SiteStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { insecureGet } from '../shared/insecure-http';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

@Injectable()
export class SiteHealthCheckService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SiteHealthCheckService.name);
  private timer?: NodeJS.Timeout;
  private isChecking = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.checkAll(), CHECK_INTERVAL_MS);
    setTimeout(() => void this.checkAll(), 15 * 1000).unref?.();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async checkAll() {
    if (this.isChecking) {
      return;
    }

    this.isChecking = true;
    try {
      const sites = await this.prisma.site.findMany({
        where: { maintenanceOverride: false },
      });

      await Promise.allSettled(sites.map((site) => this.checkOne(site)));
    } catch (error) {
      this.logger.error('Verificação de status dos sites falhou', error);
    } finally {
      this.isChecking = false;
    }
  }

  async checkOne(site: Site) {
    const status = await this.probe(site.url);

    await this.prisma.site.update({
      where: { id: site.id },
      data: { status, lastCheckedAt: new Date() },
    });
  }

  private async probe(url: string): Promise<SiteStatus> {
    const response = await insecureGet(url, REQUEST_TIMEOUT_MS);
    if (!response) {
      return SiteStatus.down;
    }

    return response.statusCode < 500 ? SiteStatus.online : SiteStatus.down;
  }
}
