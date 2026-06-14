import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'

import { ListingsController } from './listings.controller'
import { ListingsService } from './listings.service'

@Module({
  imports: [AuthModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
