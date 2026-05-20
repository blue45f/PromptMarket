import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@ApiTags('purchases')
@Controller('listings')
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/purchase')
  @ApiOperation({ summary: 'Purchase a listing (free listings are also recorded)' })
  purchase(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.purchases.purchase(user.id, id);
  }
}
