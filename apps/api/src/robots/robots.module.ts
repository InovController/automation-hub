import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RobotsController } from './robots.controller';
import { RobotsSyncService } from './robots-sync.service';
import { RobotsService } from './robots.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RobotsController],
  providers: [RobotsService, RobotsSyncService],
  exports: [RobotsService],
})
export class RobotsModule {}
