import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { CurrentUser, AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

import { TopupDto } from './dto/topup.dto'
import { UsersService } from './users.service'

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('users/:username')
  @ApiOperation({ summary: 'Get a public user profile by username' })
  getProfile(@Param('username') username: string) {
    return this.users.getPublicProfile(username)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  me(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/topup')
  @ApiOperation({ summary: 'Top up wallet balance' })
  topup(@CurrentUser() user: AuthUser, @Body() body: TopupDto) {
    return this.users.topUp(user.id, body.amountCents)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/purchases')
  @ApiOperation({ summary: 'List current user purchases' })
  myPurchases(@CurrentUser() user: AuthUser) {
    return this.users.myPurchases(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/listings')
  @ApiOperation({ summary: 'List current user listings with sales' })
  myListings(@CurrentUser() user: AuthUser) {
    return this.users.myListings(user.id)
  }
}
