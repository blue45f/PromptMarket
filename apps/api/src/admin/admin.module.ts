import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'

import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { ModerationController } from './moderation.controller'
import { ModerationService } from './moderation.service'

@Module({
  imports: [AuthModule],
  controllers: [AdminController, ModerationController],
  providers: [AdminService, ModerationService],
})
export class AdminModule {}
