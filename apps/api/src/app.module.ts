import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ExecutionsModule } from './executions/executions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { RobotsModule } from './robots/robots.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { SeedService } from './seed.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, RobotsModule, ExecutionsModule, UsersModule, ScheduledTasksModule, ReportsModule, NotificationsModule],
  controllers: [AppController],
  providers: [SeedService],
})
export class AppModule {}
