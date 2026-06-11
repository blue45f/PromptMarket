import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { ModerationController } from './moderation.controller'
import { ModerationService } from './moderation.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [AdminController, ModerationController],
  providers: [AdminService, ModerationService],
})
export class AdminModule {}
