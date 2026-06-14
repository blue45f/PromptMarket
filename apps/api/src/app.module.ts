import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'

import { AdminModule } from './admin/admin.module'
import { AuthModule } from './auth/auth.module'
import { AllExceptionsFilter } from './common/all-exceptions.filter'
import { CommunityModule } from './community/community.module'
import { HealthModule } from './health/health.module'
import { ListingsModule } from './listings/listings.module'
import { MessagesModule } from './messages/messages.module'
import { PrismaModule } from './prisma/prisma.module'
import { PurchasesModule } from './purchases/purchases.module'
import { ReviewsModule } from './reviews/reviews.module'
import { SeoModule } from './seo/seo.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: {
          ignore: (req) => req.url?.startsWith('/api/docs') ?? false,
        },
      },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    PurchasesModule,
    ReviewsModule,
    CommunityModule,
    MessagesModule,
    SeoModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
