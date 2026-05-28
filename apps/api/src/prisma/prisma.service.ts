import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

/**
 * Prisma 7 requires an explicit driver adapter on the PrismaClient
 * constructor — the datasource URL no longer lives in schema.prisma. We
 * default the URL to the dev SQLite file so seeded local installs keep
 * working without a .env present.
 */
function resolveUrl(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  return raw.startsWith('file:') ? raw : `file:${raw}`;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter: new PrismaBetterSqlite3({ url: resolveUrl() }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
