import { Module } from '@nestjs/common'
import { CommunityController } from './community.controller'
import { CommunityService } from './community.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
