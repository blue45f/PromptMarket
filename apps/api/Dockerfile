FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm install --include=dev --no-audit --no-fund

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm --workspace @promptmarket/shared run build \
 && npm --workspace @promptmarket/api run db:generate \
 && npm --workspace @promptmarket/api run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/packages/shared ./node_modules/@promptmarket/shared
EXPOSE 3000
CMD ["node", "dist/main.js"]
