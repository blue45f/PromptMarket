FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm install --include=dev --no-audit --no-fund

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm --workspace @promptmarket/shared run build \
 && npm --workspace @promptmarket/web run build

FROM nginx:alpine AS runtime
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
