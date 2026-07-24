import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExecutionIdentitiesModule } from '../execution-identities/execution-identities.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [PrismaModule, AuthModule, ExecutionIdentitiesModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
