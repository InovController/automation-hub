import { Module } from '@nestjs/common';
import { ExecutionIdentitiesModule } from '../execution-identities/execution-identities.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AthenasService } from './athenas.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule, ExecutionIdentitiesModule],
  controllers: [AuthController],
  providers: [AuthService, AthenasService],
  exports: [AuthService, AthenasService],
})
export class AuthModule {}
