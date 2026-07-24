import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SharedCredentialsController } from './shared-credentials.controller';
import { SharedCredentialsService } from './shared-credentials.service';

@Module({
  imports: [AuthModule],
  controllers: [SharedCredentialsController],
  providers: [SharedCredentialsService],
})
export class SharedCredentialsModule {}
