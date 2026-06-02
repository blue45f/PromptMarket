import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtAuthGuard } from './jwt-auth.guard'
import { AdminGuard } from './admin.guard'
import { OptionalAuthGuard } from './optional-auth.guard'

@Module({
  imports: [
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
  providers: [AuthService, JwtAuthGuard, OptionalAuthGuard, AdminGuard],
  exports: [JwtAuthGuard, OptionalAuthGuard, AdminGuard, JwtModule],
})
export class AuthModule {}
