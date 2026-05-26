# PromptMarket 아키텍처 가이드

이 문서는 `react-scaffolding`의 프론트엔드 구조를 PromptMarket 모노레포에 맞게 적용한 기준을 설명합니다. 백엔드는 기존 NestJS 모듈 구조를 유지하고, 웹 앱은 앱 조립 계층과 기능 구현 계층을 분리합니다.

## 설계 원칙

1. **앱 조립과 기능 구현 분리** - Provider, QueryClient, Router는 `apps/web/src/app`과 `apps/web/src/router`에서 조립합니다.
2. **서버 상태와 클라이언트 상태 분리** - 비동기 서버 상태는 TanStack Query, 인증/테마 같은 클라이언트 상태는 Zustand가 담당합니다.
3. **Data Router 우선** - React Router Data Router 객체 라우팅과 route-level `lazy` module을 사용합니다.
4. **도메인 단위 확장** - 기능이 커질 때 `features/<domain>` 안에 query key, query hook, mutation hook, schema/store를 함께 배치합니다.
5. **pnpm 기준 운영** - 루트 패키지 매니저는 pnpm이며 Docker, README, workspace 설정도 pnpm 기준으로 유지합니다.
6. **공통 TS 기준 공유** - 모든 workspace 패키지는 루트 `tsconfig.base.json`을 확장하고, 패키지별 옵션만 각자의 `tsconfig.json`에 둡니다.

## 웹 디렉터리 구조

```
apps/web/src/
├── app/             AppProviders, QueryClient factory
├── components/      재사용 UI 컴포넌트
│   ├── common/      RouteError 등 범용 컴포넌트
│   ├── layout/      Layout, Navbar
│   └── route/       RequireAuth 등 라우팅 보조 컴포넌트
├── features/        도메인 모듈
│   └── marketplace/ query hooks, query keys
├── hooks/           커스텀 React 훅
├── pages/           라우트 단위 페이지 모듈
├── router/          Data Router route object 정의
├── services/        API 클라이언트 및 외부 서비스 연동
├── store/           Zustand store
├── test/            Vitest setup
├── types/           프론트엔드 공유 타입
├── utils/           순수 유틸리티
├── App.tsx          루트 레이아웃 shell
└── main.tsx         DOM mount
```

## 루트 모노레포 구조

```
apps/
├── api/        NestJS API 애플리케이션
└── web/        Vite React 웹 애플리케이션
packages/
└── shared/     Zod schema, enum, model registry 공유 패키지
pnpm-workspace.yaml
pnpm-lock.yaml
tsconfig.base.json
turbo.json
```

내부 패키지 참조는 npm registry가 아니라 pnpm workspace link를 사용합니다.

```json
"@promptmarket/shared": "workspace:*"
```

## 앱 부트스트랩

`main.tsx`는 `StrictMode`와 DOM mount만 담당합니다. 실제 앱 조립은 `AppProviders`에 모읍니다.

```
main.tsx
  └─ AppProviders
      ├─ QueryClientProvider
      ├─ Toaster
      ├─ RouterProvider
      └─ ReactQueryDevtools (DEV only)
```

TanStack Query의 `QueryClient`는 `src/app/queryClient.ts`의 `createAppQueryClient()`에서 생성합니다. 테스트, Storybook, 독립 렌더링이 필요하면 factory를 사용하고, 앱 런타임은 `appQueryClient` singleton을 사용합니다.

## 라우팅

라우팅은 `createBrowserRouter(routes)` 기반입니다. 페이지 컴포넌트는 route-level `lazy` module로 동적 import합니다.

```tsx
{ index: true, lazy: lazyPage(() => import('@pages/Home')) }
{ path: 'sell', lazy: lazyProtectedPage(() => import('@pages/CreateListing')) }
```

보호 라우트는 `lazyProtectedPage`에서 페이지를 `RequireAuth`로 감쌉니다. route object는 정적으로 유지하고, 화면 구현만 필요 시점에 로드합니다.

## 상태와 데이터

- `services/api.ts`는 Axios 인스턴스, 인증 헤더 주입, 에러 메시지 추출을 담당합니다.
- `features/marketplace/queries.ts`는 리스팅, 구매, 리뷰, 내 계정, 프로필 관련 Query/Mutation hook을 제공합니다.
- `features/marketplace/queryKeys.ts`는 query key를 readonly tuple로 중앙화합니다.
- `store/auth.ts`와 `store/theme.ts`는 클라이언트 전역 상태를 담당합니다.

## 품질 게이트

| 명령 | 목적 |
| --- | --- |
| `pnpm test:run` | Vitest 단위 테스트 |
| `pnpm test:monorepo` | pnpm workspace 필수 파일, 웹 bootstrap 파일, API Docker runtime layout 검증 |
| `pnpm typecheck` | 모노레포 타입 검사 |
| `pnpm build` | shared → api → web 위상 정렬 빌드 |
| `pnpm docker:up` | Postgres + API + Web 컨테이너 실행 |

새 아키텍처 변경은 `apps/web/src/app/queryClient.test.ts`와 `apps/web/src/router/index.test.tsx`가 보호합니다.
