import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'

import { AdminGuard } from './admin.guard'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { Argon2Hasher } from './heejun/argon2-hasher'
import { oauthVerifierProvider } from './heejun/oauth.provider'
import { TokenService } from './heejun/token.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { OptionalAuthGuard } from './optional-auth.guard'
import { SuspensionGuard } from './suspension.guard'

@Module({
  imports: [
    // TokenService 가 @heejun/auth TokenIssuer 포트로 감싸는 토큰 엔진. 시크릿/알고리즘/
    // TTL 동일 → 기존 토큰 하위호환.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')
        if (!secret) throw new Error('JWT_SECRET env var is required')
        return { secret, signOptions: { expiresIn: '7d' } }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    Argon2Hasher,
    oauthVerifierProvider,
    JwtAuthGuard,
    OptionalAuthGuard,
    AdminGuard,
    SuspensionGuard,
  ],
  exports: [JwtAuthGuard, OptionalAuthGuard, AdminGuard, SuspensionGuard, TokenService],
})
export class AuthModule {}
