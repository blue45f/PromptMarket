import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'

import { CommunityController } from './community.controller'
import { CommunityService } from './community.service'

@Module({
  imports: [AuthModule],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
