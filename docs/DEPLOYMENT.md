# PromptMarket 배포 가이드

이 문서는 PromptMarket의 **실제 배포 형상**을 기준으로 작성되었습니다. 저장소에 이미 들어 있는 워크플로/Dockerfile/compose 설정을 그대로 따르고, 비어 있던 백엔드 호스팅 부분을 보강했습니다.

## 1. 아키텍처: 어떤 계층이 어디로 가는가

PromptMarket은 pnpm 모노레포로 구성된 풀스택 앱입니다.

| 계층                     | 패키지            | 런타임                     | 호스팅                                 | 트리거                                                  |
| ------------------------ | ----------------- | -------------------------- | -------------------------------------- | ------------------------------------------------------- |
| **Frontend (web)**       | `apps/web`        | Vite + React SPA (정적)    | **Vercel**                             | `.github/workflows/deploy-vercel-web.yml`               |
| **Backend (api)**        | `apps/api`        | NestJS 11 (Node 22)        | **Render** (Docker) — 또는 자체 호스트 | `.github/workflows/deploy-render-api.yml` + render.yaml |
| **공유 패키지 (shared)** | `packages/shared` | Zod 스키마/enum 라이브러리 | 퍼블리시하지 않음(workspace link)      | 빌드 시 `shared → api → web` 위상 정렬                  |

> 정적 SPA(웹)와 API(서버)를 분리 배포합니다. 웹은 빌드 산출물을 CDN에 올리고, API는 컨테이너로 상시 구동합니다.

### 로컬/단일 호스트 대안: docker-compose

저장소 루트의 `docker-compose.yml`은 **로컬/단일 VM** 배포 경로입니다. nginx(web) + NestJS(api) + Postgres 컨테이너를 한 번에 띄웁니다. 분리 호스팅(Vercel+Render)을 쓰지 않고 한 서버에 전부 올리고 싶을 때 사용합니다.

```bash
pnpm docker:up     # docker compose up -d --build
#  web → http://localhost:5173 (nginx가 /api와 /sitemap.xml을 api로 프록시)
#  api → http://localhost:3000
pnpm docker:down
```

---

## 2. 데이터베이스에 대한 중요 사실 (반드시 읽을 것)

런타임은 **Prisma 7 + better-sqlite3 드라이버 어댑터**(`apps/api/src/prisma/prisma.service.ts`)를 사용합니다. 이 어댑터는 **SQLite 전용**이며, 어떤 `DATABASE_URL`이 들어와도 `file:` 경로로 강제 변환합니다.

- 즉, `docker-compose.yml`이 Postgres 컨테이너를 띄우더라도 **API는 SQLite로 동작**합니다(Postgres는 향후 전환용 인프라).
- 호스팅 환경에서는 SQLite 파일이 **영구 디스크(persistent disk)** 위에 있어야 합니다. 그렇지 않으면 배포/재시작마다 데이터가 사라집니다.
- 관리형 Postgres로 전환하려면 먼저 드라이버 어댑터를 `@prisma/adapter-pg` 등으로 교체하고 `schema.prisma`의 provider를 바꿔야 합니다. 그 전까지 `DATABASE_URL=postgresql://...`을 넣어도 SQLite로 동작합니다.

마이그레이션은 `apps/api/prisma/migrations`의 SQL로 관리하며, 운영 반영은 `prisma migrate deploy`로 합니다.

---

## 3. 프론트엔드 배포 (Vercel)

### 워크플로

`.github/workflows/deploy-vercel-web.yml`이 `main` 푸시 시 동작합니다. **`VERCEL_TOKEN` 시크릿이 없으면 자동으로 스킵**되므로, 시크릿을 넣기 전까지는 안전하게 머지됩니다.

빌드/배포 핵심 명령(워크플로 내부):

```bash
pnpm install --frozen-lockfile
cd apps/web
vercel deploy --prod --confirm --token "$VERCEL_TOKEN"
```

### 빌드 산출물

`apps/web`의 빌드는 `pnpm --filter @promptmarket/web build`(= `tsc -b && vite build`)이며 산출물은 `apps/web/dist`(정적 SPA)입니다.

### 필요한 GitHub Secret

| Secret         | 용도                 | 없을 때        |
| -------------- | -------------------- | -------------- |
| `VERCEL_TOKEN` | Vercel CLI 인증 토큰 | 배포 단계 스킵 |

### Vercel 대시보드에서 직접 해야 하는 설정 (CI가 못 하는 부분)

1. Vercel 프로젝트를 생성하고 이 저장소를 연결합니다.
2. **Root Directory**: 모노레포이므로 빌드 컨텍스트를 `apps/web`로 잡거나, 워크플로처럼 `apps/web`에서 `vercel deploy`를 실행하도록 둡니다.
   - SPA 빌드는 `@promptmarket/shared`(workspace) 빌드에 의존하므로, Vercel이 루트에서 `pnpm install`을 수행하도록 설정하거나, 프로젝트의 Build Command를 `pnpm --filter @promptmarket/shared build && pnpm --filter @promptmarket/web build`로 지정하고 Output Directory를 `apps/web/dist`로 지정합니다.
3. **환경 변수(웹)**: API와 통신할 베이스 경로. 현재 웹은 axios 인스턴스(`apps/web/src/services/api.ts`)로 `/api`를 호출합니다.
   - 같은 도메인 뒤에서 서빙하지 않는 한, Vercel `rewrites` 또는 빌드 타임 API base URL로 Render API 도메인을 가리키도록 구성하세요(`/api/*` → `https://promptmarket-api.onrender.com/api/*`).
4. `Settings → Git`에서 Production Branch를 `main`으로 둡니다.

### 미리보기(Preview) vs 운영(Production)

- 워크플로는 `--prod` 플래그로 **항상 운영 배포**를 수행합니다(트리거: `main` 푸시 / 수동 `workflow_dispatch`).
- PR 미리보기 배포가 필요하면 Vercel 대시보드의 Git 통합을 켜면 됩니다(PR마다 Preview URL 발급). 이 경우 워크플로의 `--prod` 경로와 역할이 나뉩니다.

---

## 4. 백엔드 배포 (Render, Docker) — 이번에 보강한 부분

프론트엔드는 GitHub Action으로 배포되고 있었지만 **백엔드는 호스팅 프로바이더 설정과 배포 워크플로가 없었습니다.** 프론트의 "시크릿 없으면 스킵" 패턴을 그대로 백엔드에도 적용해 보강했습니다.

### 추가/변경한 파일

| 파일                                      | 역할                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `render.yaml`                             | Render Blueprint — Docker 런타임으로 `apps/api/Dockerfile` 빌드, 영구 디스크, 헬스체크, env vars  |
| `.github/workflows/deploy-render-api.yml` | `main` 푸시 시 Render Deploy Hook 호출. `RENDER_DEPLOY_HOOK_URL` 시크릿 없으면 스킵               |
| `.dockerignore`                           | Docker 빌드 컨텍스트에서 `node_modules`/`dist`/`*.db`/`.env` 제외(이미지 경량화·시크릿 누출 방지) |
| `apps/api/src/health/*`                   | `/api/health`(liveness), `/api/health/ready`(DB readiness) 헬스 엔드포인트                        |

### 빌드/실행 방식

`apps/api/Dockerfile`(기존 멀티스테이지)을 그대로 사용합니다.

- `node:22-alpine`, `pnpm install --frozen-lockfile`
- `pnpm --filter @promptmarket/api deploy --prod /app`로 **prod 의존성만** 가진 격리 런타임 생성
- 시작 명령: `node dist/src/main.js`
- 외부 포트: Render는 `PORT` 환경변수(여기선 `10000`)로 트래픽을 라우팅하며, NestJS `main.ts`가 `process.env.PORT`를 읽어 바인딩합니다.

### 헬스체크

`render.yaml`의 `healthCheckPath: /api/health`는 이번에 추가한 liveness 엔드포인트를 가리킵니다(전역 prefix가 `api`라서 경로가 `/api/health`).

- `GET /api/health` — 의존성 없는 liveness(프로세스 살아있음). DB 장애로 컨테이너가 죽지 않도록 DB를 건드리지 않습니다.
- `GET /api/health/ready` — DB에 `SELECT 1`을 던지는 readiness. 실패 시 500이 아니라 `{ status: "degraded", database: "down" }`을 반환해 호출자가 구조화된 판단을 할 수 있게 합니다.

### 마이그레이션 (배포 시)

운영 이미지는 prod 의존성만 포함하므로 **Prisma CLI(devDependency)가 없습니다.** 따라서 `render.yaml`의 `preDeployCommand`에서 온디맨드로 CLI를 받아 마이그레이션을 적용합니다(이미지에는 `apps/api/prisma`가 포함됨).

```yaml
preDeployCommand: npx -y prisma@7 migrate deploy --schema ./prisma/schema.prisma
```

`migrate deploy`는 멱등이므로 매 배포마다 실행해도 안전합니다.

### 영구 디스크 (SQLite)

```yaml
disk:
  name: promptmarket-sqlite
  mountPath: /app/data
  sizeGB: 1
# DATABASE_URL=file:/app/data/prod.db
```

> **무료 플랜에는 영구 디스크가 없습니다.** SQLite 데이터를 보존하려면 `plan: starter` 이상이 필요합니다(그래서 blueprint를 `starter`로 설정).

### 필요한 GitHub Secret

| Secret                   | 용도                                       | 없을 때        |
| ------------------------ | ------------------------------------------ | -------------- |
| `RENDER_DEPLOY_HOOK_URL` | Render 서비스의 Deploy Hook URL(curl 호출) | 배포 단계 스킵 |

### Render 대시보드에서 직접 해야 하는 설정 (CI가 못 하는 부분)

1. **New → Blueprint**로 이 저장소를 연결합니다. Render가 `render.yaml`을 읽어 서비스+디스크를 프로비저닝합니다.
2. `sync: false`로 비워 둔 시크릿을 대시보드에서 입력합니다.
   - `JWT_SECRET` — 강력한 랜덤 값(로컬 dev의 `dev-secret-change-me`를 절대 재사용하지 말 것).
   - `ALLOWED_ORIGINS` — `main.ts`의 `app.enableCors`가 읽는 CORS 허용 출처. Vercel 웹 도메인을 콤마 구분으로 넣습니다(예: `https://promptmarket.vercel.app`).
3. 서비스의 **Deploy Hook URL**을 복사해 GitHub `RENDER_DEPLOY_HOOK_URL` 시크릿에 저장하면 push-to-deploy가 연결됩니다(또는 `autoDeploy: true`로 Render 자체 Git 연동만 사용해도 됩니다).

### 운영에 필요한 백엔드 환경 변수 요약

| 변수              | 예시/기본값              | 출처                             |
| ----------------- | ------------------------ | -------------------------------- |
| `NODE_ENV`        | `production`             | render.yaml                      |
| `PORT`            | `10000`                  | render.yaml (Render 라우팅 포트) |
| `DATABASE_URL`    | `file:/app/data/prod.db` | render.yaml (영구 디스크)        |
| `JWT_SECRET`      | (대시보드에서 입력)      | `sync: false`                    |
| `ALLOWED_ORIGINS` | `https://<web-domain>`   | `sync: false`                    |

---

## 5. 미리보기 vs 운영 차이 한눈에

| 항목         | Preview                                    | Production                             |
| ------------ | ------------------------------------------ | -------------------------------------- |
| Web (Vercel) | Vercel Git 통합 시 PR마다 Preview URL      | `main` 푸시 → 워크플로 `vercel --prod` |
| API (Render) | (선택) PR Preview Environments 활성화 가능 | `main` 푸시 → Deploy Hook/autoDeploy   |
| 시크릿       | 프로바이더별 Preview 스코프 값 사용        | Production 스코프 값                   |
| DB           | 별도 미리보기 디스크 권장                  | 영구 디스크 `promptmarket-sqlite`      |

---

## 6. 배포 전 점검 (게이트)

배포 전에 항상 저장소의 통합 게이트를 통과시킵니다.

```bash
pnpm run verify   # validate:architecture + format:check + lint + typecheck + test:run + build
```

CI에서도 `.github/workflows/ci.yml`이 `pnpm run verify`를 실행하며, 브랜치 보호/CodeRabbit 게이트가 머지 전에 함께 강제됩니다.

---

## 7. 수동 배포 치트시트

```bash
# 프론트엔드(로컬에서 강제 운영 배포)
pnpm install --frozen-lockfile
pnpm --filter @promptmarket/shared build
cd apps/web && vercel deploy --prod --token "$VERCEL_TOKEN"

# 백엔드(Render Deploy Hook 직접 호출)
curl -fsS "$RENDER_DEPLOY_HOOK_URL"

# 단일 호스트(compose)
JWT_SECRET=$(openssl rand -hex 32) pnpm docker:up
```
