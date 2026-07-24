import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PowerBIPollerService } from './powerbi-poller.service';
import { PowerBIService } from './powerbi.service';
import { SiteHealthCheckService } from './site-health-check.service';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

@Module({
  imports: [PrismaModule, AuthModule, MailModule],
  controllers: [SitesController],
  providers: [SitesService, SiteHealthCheckService, PowerBIService, PowerBIPollerService],
  exports: [SitesService],
})
export class SitesModule {}
