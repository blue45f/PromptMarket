import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

import { AuthService } from './auth.service'
import { CurrentUser, AuthUser } from './current-user.decorator'
import { GoogleAuthDto } from './dto/google-auth.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Get('config')
  @ApiOperation({ summary: 'Public auth config (Google client id)' })
  config() {
    return this.auth.publicConfig()
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('google')
  @ApiOperation({ summary: 'Sign in with a Google ID token' })
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.googleAuth(dto.credential)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Return the current authenticated user' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id)
  }
}
