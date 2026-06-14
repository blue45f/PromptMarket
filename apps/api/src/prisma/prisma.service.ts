import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

/**
 * Prisma 7 requires an explicit driver adapter on the PrismaClient
 * constructor — the datasource URL no longer lives in schema.prisma. We default to a local Postgres URL so installs work without a .env;
 * production/dev set DATABASE_URL to the Neon connection string.
 */
function resolveUrl(): string {
  return process.env.DATABASE_URL ?? 'postgresql://localhost:5432/promptmarket'
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: resolveUrl() }) })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
