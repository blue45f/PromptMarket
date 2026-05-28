import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 config. The datasource URL no longer lives in schema.prisma, so we
 * surface it here for `prisma migrate` / `prisma db push`. Runtime queries go
 * through PrismaClient and the better-sqlite3 adapter we wire up in
 * apps/api/src/prisma/prisma.service.ts — the adapter is not part of the
 * PrismaConfig surface; it just lives on the client constructor.
 */
export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
});
