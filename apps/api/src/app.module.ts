import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AutomationRequestsModule } from './automation-requests/automation-requests.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { ExecutionsModule } from './executions/executions.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { RobotsModule } from './robots/robots.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { SeedService } from './seed.service';
import { SharedCredentialsModule } from './shared-credentials/shared-credentials.module';
import { SitesModule } from './sites/sites.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, RobotsModule, ExecutionsModule, UsersModule, ScheduledTasksModule, ReportsModule, NotificationsModule, MaintenanceModule, SitesModule, DepartmentsModule, SharedCredentialsModule, IntegrationsModule, AutomationRequestsModule],
  controllers: [AppController],
  providers: [SeedService],
})
export class AppModule {}
