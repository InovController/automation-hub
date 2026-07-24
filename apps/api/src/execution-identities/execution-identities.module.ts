import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExecutionIdentitiesService } from './execution-identities.service';

@Module({
  imports: [PrismaModule],
  providers: [ExecutionIdentitiesService],
  exports: [ExecutionIdentitiesService],
})
export class ExecutionIdentitiesModule {}
