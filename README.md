# PromptMarket

**프롬프트**, **`CLAUDE.md`**, **`agent.md`**, **Claude Code 스킬**, **MCP 서버**, **슬래시 명령어**, **서브 에이전트**, **`.cursorrules`**를 둘러보고, 구매하고, 판매하고, 공유할 수 있는 마켓플레이스입니다. LLM별 분류 체계와 프롬프트 엔지니어링 기법 카탈로그를 함께 제공합니다.

> 2026년 기준의 최신 스택인 **React 19** + **NestJS 11** + **Prisma 7**로 구축했으며, 공유 **Zod** 스키마 패키지로 API 계약의 단일 진실 공급원을 유지합니다.

<p align="center">
  <img src="docs/screenshots/home.png" alt="PromptMarket 홈 — 마켓플레이스 그리드(타입별 커버·모델 배지·평점)" width="820" />
</p>
<p align="center">
  <img src="docs/screenshots/home-mobile.png" alt="PromptMarket 모바일 홈" width="240" />
</p>

---

## 주요 기능

- 🛍 **마켓플레이스 그리드** — 타입별 그라디언트 커버, 모델 배지, 가격 코너 배지, ⭐ 평점, 다운로드 카운터, 호버 시 상승 효과
- 🌗 **다크 모드** — 라이트 / 다크 / 시스템 모드, `localStorage` 저장, OS 설정 변경 실시간 감지
- 🎯 **8가지 리스팅 타입** — Prompt · CLAUDE.md · agent.md · **Skill** · **MCP Server** · **Slash Command** · **Sub-agent** · **.cursorrules**
- 🤖 **LLM별 분류 체계** — 모든 리스팅은 21개 모델 슬러그 중 하나 이상으로 태깅됩니다. Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5, GPT-5 / o3, Gemini 2.5, Llama 4, Grok 3, Mistral Large 3, DeepSeek V3와 Claude Code, Cursor, Windsurf, Copilot, Cline, Aider 같은 도구를 지원합니다. 모델 **또는** 벤더(Anthropic / OpenAI / Google / Meta / xAI / Mistral / DeepSeek)로 필터링할 수 있습니다.
- 🧠 **프롬프트 엔지니어링 기법 필터** — zero-shot · few-shot · **chain-of-thought** · **tree-of-thoughts** · role-prompt · self-consistency · **ReAct** · **RAG** · reflexion · plan-and-solve · meta-prompt
- 🏷 **메타데이터** — 난이도(beginner / intermediate / advanced), 라이선스(MIT / Apache-2.0 / CC-BY-4.0 / CC0 / Proprietary), semver 버전
- 🔎 **검색 + 패싯 필터** — 타입 · 카테고리(14개) · 모델 · 벤더 · 기법 · 난이도 · 무료/유료 필터를 지원합니다. 데스크톱에서는 고정 사이드바, 모바일에서는 드로어(Radix Dialog)를 사용하며, 해제 가능한 필터 칩을 제공합니다.
- 🧮 **정렬** — 최신순 · 트렌딩순(다운로드 기준) · 인기순(평균 평점 기준)
- 🔐 **페이월 미리보기** — 처음 약 300자는 모두에게 공개되고, 전체 본문은 구매 후 열람할 수 있습니다.
- 💸 **목업 지갑** — 잔액 충전, 리스팅 구매, Prisma `$transaction`을 통한 작성자 자동 정산
- 📝 **리스팅 상세 화면** — 16:9 그라디언트 히어로, Radix 탭(개요 / 리뷰 / 관련 항목), 고정 가격 + 작성자 + 메타데이터 사이드바, 체크 아이콘 피드백이 포함된 **복사** + **`.md` 다운로드**
- 🪞 **생성 폼 실시간 미리보기** — 입력하는 동안 카드와 Markdown 렌더링이 함께 갱신됩니다.
- 🔁 **관련 리스팅** — `/listings/related/:id`가 타입 + 카테고리 기준으로 추천합니다.
- ⭐ **리뷰 및 평점** — 구매자 검증 기반, 1-5점 별점 + 코멘트, 리뷰별 대댓글 스레드와 제작자 답글 표식
- 📊 **홈페이지 통계 스트립** — `/listings/stats`에서 가져온 `totalListings` · `totalDownloads` · `totalCreators` 표시(인메모리 30초 캐시)
- 👤 **작성자 대시보드** — 판매량 + 수익이 포함된 내 리스팅, 구매한 항목 라이브러리, 지갑
- 🪪 **JWT 인증**(**argon2id** 해싱 — OWASP 2026 기본 권장값)
- 📑 `/api/docs`의 **자동 생성 OpenAPI** 문서(Swagger UI, **nestjs-zod** 패치 적용)
- ⚡ **요율 제한**이 적용된 인증 엔드포인트(`@nestjs/throttler` — 로그인 + 회원가입은 10회/분, 그 외는 120회/분)
- 🐳 **Docker compose** — 한 번의 명령으로 nginx 뒤에서 Postgres + API + Web 실행
- ⚡ **스켈레톤 + 페이드인 애니메이션 + `prefers-reduced-motion` 대응**

---

## 기술 스택

| 계층         | 기술                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | Vite 8 · React **19**(React Compiler 활성화) · TypeScript · **Tailwind v4**(Oxide 엔진, CSS 전용 `@theme` 설정, 클래스 기반 다크 모드) · **TanStack Query v5** · **React Hook Form + Zod resolver** · Zustand 5 · React Router 7 · **lucide-react v1** · react-hot-toast · **Radix UI**(Dialog / Tabs / DropdownMenu) · clsx · **tailwind-merge v3** · Inter 폰트 |
| **Backend**  | NestJS **11** · Prisma **7**(기본 SQLite, Docker에서는 Postgres) · **nestjs-zod** · **argon2id** · JWT · **@nestjs/swagger** · **@nestjs/throttler** · **helmet** · **nestjs-pino**(pino-http 11 / pino-pretty 13)                                                                                                                                                |
| **Shared**   | `@promptmarket/shared` — **Zod** 스키마 + 21개 모델 레지스트리 + 기법 / 난이도 / 라이선스 enum + 뷰 헬퍼. api와 web에서 동일하게 사용하므로 DTO 불일치가 발생하지 않습니다.                                                                                                                                                                                       |
| **Tooling**  | **pnpm workspaces** · Docker / docker-compose · 멀티 스테이지 Dockerfile · **ESLint 10**(flat config, typescript-eslint + react-hooks + react-refresh) · **Prettier**                                                                                                                                                                                             |

---

## 빠른 시작하기(로컬, SQLite)

```bash
# 1. 의존성 설치(postinstall에서 @promptmarket/shared 빌드)
pnpm install

# 2. SQLite DB 설정 및 샘플 데이터 시드
pnpm db:push
pnpm seed

# 3. web + api 병렬 실행
pnpm dev
#  web → http://localhost:5173
#  api → http://localhost:3000/api
#  docs → http://localhost:3000/api/docs
```

### 데모 계정(seed 후 사용 가능)

| 이메일              | 비밀번호   | 역할            |
| ------------------- | ---------- | --------------- |
| `alice@example.com` | `password` | 판매자          |
| `bob@example.com`   | `password` | 구매자          |
| `carol@example.com` | `password` | 판매자 + 구매자 |

각 데모 사용자는 목업 지갑에 **$100**를 보유한 상태로 시작합니다.

---

## Docker로 실행하기(Postgres)

```bash
docker compose up -d --build
#  web → http://localhost:5173   (nginx가 /api를 api 컨테이너로 프록시)
#  api → http://localhost:3000
#  postgres → localhost:5432  (user/pw: promptmarket)
```

`docker compose up` 이후 Postgres에 시드하려면 다음을 실행합니다.

```bash
DATABASE_URL=postgresql://promptmarket:promptmarket@localhost:5432/promptmarket \
  pnpm --filter @promptmarket/api db:push
DATABASE_URL=postgresql://promptmarket:promptmarket@localhost:5432/promptmarket \
  pnpm seed
```

## DB 마이그레이션

로컬 개발은 빠른 스키마 동기화를 위해 기존처럼 `pnpm db:push`를 사용할 수 있습니다.
스테이징/운영처럼 재현 가능한 배포 이력이 필요한 환경은 다음 명령을 사용합니다.

```bash
pnpm db:migrate:deploy
```

이 저장소는 초기에는 `db:push` 기반으로 운영됐기 때문에 `apps/api/prisma/migrations/20260602000000_initial_schema`는 현재 스키마의 baseline입니다. 이미 같은 스키마가 적용된 기존 DB에서 migration 체계로 전환할 때는 Prisma baseline 절차로 해당 migration을 applied 상태로 표시한 뒤 `pnpm db:migrate:deploy`를 사용하세요.

---

## 저장소 구조

```
apps/
  web/         # Vite + React 19 프론트엔드
    src/
      app/       # AppProviders, QueryClient factory
      router/    # React Router Data Router + lazy route modules
      domains/   # 도메인별 query/key 모듈 (계층: domains)
      infrastructure/ # API 클라이언트 (계층: infrastructure)
      utils/     # 포맷터, className 유틸리티
      types/     # 프론트엔드 공유 타입
  api/         # NestJS 11 백엔드
    prisma/    # 스키마 + 시드
packages/
  shared/      # Zod 스키마(API 계약의 단일 진실 공급원)
pnpm-workspace.yaml
tsconfig.base.json
docker-compose.yml
```

---

## 스크립트(루트)

| 명령어                   | 설명                                                            |
| ------------------------ | --------------------------------------------------------------- |
| `pnpm dev`               | api + web를 병렬 실행합니다.                                    |
| `pnpm build`             | shared → api → web 순서로 빌드됩니다(위상 정렬).                |
| `pnpm typecheck`         | 모노레포 전체에서 `tsc --noEmit`을 실행합니다.                  |
| `pnpm lint`              | 루트 flat config로 `eslint .`를 실행합니다(web/api/shared).     |
| `pnpm test:run`          | Vitest 테스트를 실행합니다.                                     |
| `pnpm test:monorepo`     | pnpm workspace 필수 파일과 Docker/API 런타임 배치를 검증합니다. |
| `pnpm db:push`           | 설정된 DB에 Prisma 스키마를 적용합니다.                         |
| `pnpm db:migrate:deploy` | 스테이징/운영 DB에 Prisma migration을 적용합니다.               |
| `pnpm seed`              | 샘플 사용자 / 리스팅 / 리뷰를 시드합니다.                       |
| `pnpm shared:build`      | 공유 Zod 스키마 패키지를 다시 빌드합니다.                       |
| `pnpm docker:up`         | 모든 컨테이너를 빌드하고 시작합니다.                            |
| `pnpm docker:down`       | 컨테이너를 중지합니다.                                          |

---

## 아키텍처 핵심

- **API 계약의 단일 진실 공급원.** 모든 Zod 스키마(예: `CreateListingSchema`, `ListingCard`)는 `packages/shared`에 한 번만 정의됩니다. 백엔드는 각 스키마를 `createZodDto(...)`로 감싸 NestJS 파이프 + Swagger에 사용하고, 프론트엔드는 RHF의 `zodResolver`에 전달합니다. 구조적으로 클라이언트와 서버 간 드리프트가 발생할 수 없습니다.
- **react-scaffolding식 프론트엔드 조립.** `apps/web/src/main.tsx`는 DOM mount만 담당하고, `src/app/AppProviders.tsx`가 QueryClient, RouterProvider, Toaster, React Query Devtools를 조립합니다. 라우트 정의는 `src/router`에 모아 두고 페이지는 route-level lazy module로 로드합니다.
- **React Compiler.** `apps/web`은 React 19 네이티브 React Compiler를 활성화합니다(`@vitejs/plugin-react`의 `reactCompilerPreset`을 `@rolldown/plugin-babel`로 적용). 컴포넌트 메모이제이션이 빌드 타임에 자동 삽입되어 수동 `useMemo` / `useCallback` 의존성이 줄어듭니다.
- **계층형 도메인 아키텍처.** 웹 앱은 `app`/`domains`/`infrastructure`/`shared` 4계층으로 나뉘고 ESLint `boundaries`가 의존 방향을 강제합니다. API 클라이언트는 `src/infrastructure`, 리스팅/구매/프로필 query와 query key는 `src/domains/marketplace`, 포맷터와 className 헬퍼는 `src/utils`(shared), 화면 공유 타입은 `src/types`(shared)에 둡니다.
- **라우트 단위 복구 UI.** Data Router의 `errorElement`가 `RouteError`를 렌더링해 lazy route 로딩이나 렌더링 오류를 페이지 단위로 처리합니다.
- **pnpm 모노레포 운영.** 루트 `pnpm-workspace.yaml`이 `apps/*`, `packages/*`를 워크스페이스로 묶고, 내부 의존성은 `workspace:*`로 고정합니다. 모든 패키지는 루트 `tsconfig.base.json`을 확장해 공통 TypeScript 기준을 공유합니다.
- **검증 파이프라인.** 요청은 `ZodValidationPipe`(`nestjs-zod`)를 통과합니다. 잘못된 페이로드는 필드 경로 목록이 포함된 구조화된 4xx 응답으로 반환되며, 수동 `class-validator` 데코레이터가 필요하지 않습니다.
- **인증.** 커스텀 `JwtAuthGuard`가 `Authorization: Bearer …`를 읽고 `@nestjs/jwt`로 검증한 뒤 `req.user`를 붙입니다. 비밀번호는 **argon2id**로 해싱합니다(2026년 OWASP 권장 기본값).
- **구매 흐름.** `POST /listings/:id/purchase`는 단일 Prisma `$transaction`으로 실행됩니다. 구매자 잔액 차감, 작성자 정산, `Purchase` 행 생성, `downloads` 증가가 원자적으로 처리됩니다. 구매자가 작성자인 경우, 이미 보유한 경우, 잔액이 부족한 경우에는 거절됩니다.
- **요율 제한.** 전역 기본값은 60 req/min이며, 인증 엔드포인트는 `@Throttle({ auth: … })`를 통해 10 req/min으로 제한됩니다.
- **로깅.** 개발 환경에서는 `pino-pretty`를 포함한 `nestjs-pino`를 사용하고, 프로덕션에서는 구조화된 JSON 로그를 출력합니다.
- **pnpm 기반 병렬/순차 실행.** `build`는 shared → api → web 순으로 순차 실행되며, `dev`는 api + web를 동시 실행합니다.

---

## API 표면(일부)

| 메서드 | 경로                                               | 비고                                                                                                                                                     |
| ------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/auth/register`                               | 요율 제한 적용                                                                                                                                           |
| `POST` | `/api/auth/login`                                  | 요율 제한 적용                                                                                                                                           |
| `GET`  | `/api/auth/me`                                     | Bearer                                                                                                                                                   |
| `GET`  | `/api/listings`                                    | 필터: `type`, `category`, `q`, **`model`**, **`vendor`**, **`technique`**, **`difficulty`**, `free`, `sort=newest\|trending\|top`, `page`, `pageSize≤48` |
| `GET`  | `/api/listings/:slug`                              | 선택적 인증(무료 / 구매 완료 / 소유자인 경우에만 `body` 반환)                                                                                            |
| `GET`  | `/api/listings/stats`                              | `{ totalListings, totalDownloads, totalCreators }` — 30초 인메모리 캐시                                                                                  |
| `GET`  | `/api/listings/related/:id?limit=4`                | 타입 또는 카테고리가 같은 리스팅, 자기 자신 제외                                                                                                         |
| `POST` | `/api/listings`                                    | Bearer                                                                                                                                                   |
| `POST` | `/api/listings/:id/purchase`                       | Bearer; 원자적 잔액 이동                                                                                                                                 |
| `POST` | `/api/listings/:id/reviews`                        | Bearer; 구매자 전용                                                                                                                                      |
| `POST` | `/api/listings/:id/reviews/:reviewId/replies`      | Bearer; 리뷰 스레드에 1-1,000자 대댓글 작성                                                                                                              |
| `GET`  | `/api/me`, `/api/me/purchases`, `/api/me/listings` | Bearer                                                                                                                                                   |
| `POST` | `/api/me/topup`                                    | Bearer                                                                                                                                                   |
| `GET`  | `/api/users/:username`                             | 공개 프로필                                                                                                                                              |

전체 스키마는 `http://localhost:3000/api/docs`의 **Swagger UI**에서 확인할 수 있습니다.

---

## 라이선스

MIT.
