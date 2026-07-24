import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExecutionIdentitiesModule } from '../execution-identities/execution-identities.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AuthModule, ExecutionIdentitiesModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
