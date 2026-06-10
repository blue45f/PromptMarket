# syntax=docker/dockerfile:1
#
# Production image for @promptmarket/api (NestJS 11 + Prisma 7 driver adapter
# + better-sqlite3 + argon2). Build from the REPO ROOT:
#   docker build -f apps/api/Dockerfile -t promptmarket-api .
#
# Hardened against three real failure modes (proven on the EC2 deploy):
#  - argon2/better-sqlite3 compile from source on alpine/musl -> toolchain
#  - pnpm 11 needs `deploy --legacy` for the non-injected workspace dep
#  - `pnpm deploy` drops the generated Prisma client -> copy .prisma over
#
# The SQLite DB is NOT created in-container: schema.prisma is adapter-only
# (no datasource url) and the committed migrations lag the schema, so the
# deploy flow creates/seeds prod.db locally (db push + seed) and ships it
# into the volume mounted at /app/data. The container just runs node.
FROM node:22-alpine AS deps
WORKDIR /repo
RUN corepack enable
RUN apk add --no-cache python3 make g++ libc6-compat
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @promptmarket/shared build \
 && pnpm --filter @promptmarket/api db:generate \
 && pnpm --filter @promptmarket/api build \
 && pnpm --filter @promptmarket/api deploy --prod --legacy /app
# pnpm deploy does not carry the generated Prisma client into the pruned
# bundle; @prisma/client re-exports '.prisma/client/default', so copy it
# next to the deployed @prisma/client (paths resolved, not hardcoded).
RUN GEN_SRC=$(node -e "const p=require.resolve('@prisma/client',{paths:['/repo/apps/api']});const m=p.match(/(.*\/node_modules)\/@prisma\/client/);process.stdout.write(m[1]+'/.prisma')") \
 && DEST=$(node -e "const p=require.resolve('@prisma/client',{paths:['/app']});const m=p.match(/(.*\/node_modules)\/@prisma\/client/);process.stdout.write(m[1]+'/.prisma')") \
 && echo "copying generated client: $GEN_SRC -> $DEST" \
 && rm -rf "$DEST" && cp -R "$GEN_SRC" "$DEST"

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat
COPY --from=build /app ./
RUN mkdir -p /app/data
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/prod.db
EXPOSE 3000
# main.ts: setGlobalPrefix('api'); JWT_SECRET env is required at runtime.
CMD ["node", "dist/src/main.js"]
