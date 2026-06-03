# PromptMarket Development Guide

## 개요

이 프로젝트는 아키텍처 문서 정합성, 코드 변경 범위, CI 게이트를 함께 관리합니다.

## 필수 검증 흐름

- 아키텍처 문서 점검을 선행합니다.
- 타입/린트/테스트/빌드 검증을 완료합니다.
- PR 병합 전 증적을 남깁니다.

## 최소 실행 커맨드

- `pnpm run dev`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run verify`
- `pnpm run ci`
- `pnpm run db:generate`
- `pnpm run db:push`
- `pnpm run db:migrate:deploy`
- `pnpm run seed`

## 아키텍처 변경 규칙

1. 도메인 경계와 공유 타입 계약 변경은 `docs/ARCHITECTURE.md`에서 먼저 반영합니다.
2. 계약 변경이 API/스키마에 영향을 주면 문서, 테스트 계획, Prisma migration을 함께 갱신합니다.
3. `pnpm run verify`는 `validate:architecture`가 선행된 상태여야 합니다.

## DB 변경 규칙

- 로컬 실험은 `pnpm run db:push`로 빠르게 동기화할 수 있습니다.
- 스테이징/운영에 반영할 스키마 변경은 `apps/api/prisma/migrations`에 migration SQL을 남깁니다.
- 기존 `db:push` 기반 DB를 migration 체계로 전환할 때는 baseline migration을 applied 상태로 표시한 뒤 `pnpm run db:migrate:deploy`를 사용합니다.

## 배포와 헬스체크

- 전체 배포 형상(프론트=Vercel, 백엔드=Render, 단일 호스트=docker-compose)과 필요한 시크릿/대시보드 절차는 `docs/DEPLOYMENT.md`를 따릅니다.
- API에는 호스팅 헬스체크용 엔드포인트가 있습니다.
  - `GET /api/health` — 의존성 없는 liveness 프로브.
  - `GET /api/health/ready` — DB 연결을 확인하는 readiness 프로브(`SELECT 1`).
- 두 라우트는 인증 가드가 없고 `@SkipThrottle()`이라 플랫폼 프로브가 레이트리밋에 걸리지 않습니다. 헬스 응답 형태를 바꾸면 `apps/api/src/health/health.service.spec.ts`도 함께 갱신합니다.
- Docker 빌드 컨텍스트는 루트 `.dockerignore`로 슬림하게 유지합니다(`node_modules`/`dist`/`*.db`/`.env` 제외). 새 빌드 산출물·로컬 DB·시크릿 파일이 추가되면 이 목록도 점검합니다.

## 프론트엔드 접근성(A11y)

웹 앱(`apps/web`)은 SPA이므로 라우트가 바뀌어도 문서가 새로 로드되지 않습니다. 멀티페이지 사이트에서 자동으로 얻는 두 가지 — (1) 스크린리더의 페이지 제목 안내, (2) 새 페이지 콘텐츠로의 포커스 이동 — 이 SPA에서는 조용히 누락되므로 다음 스캐폴딩으로 보강합니다.

- **Skip link + `<main>` 랜드마크**: `Layout.tsx`의 첫 포커스 요소가 `#main`으로 점프하는 스킵 링크이고, `<main id="main" tabIndex={-1}>`이 프로그래매틱 포커스 타깃입니다. 신규 페이지/레이아웃은 이 단일 `<main>` 랜드마크를 유지합니다.
- **라우트 변경 안내 + 포커스 관리(`RouteAnnouncer`)**: `components/RouteAnnouncer.tsx`가 `Layout`에 한 번 마운트됩니다. 라우트(`pathname`)가 바뀌면 한 프레임 뒤 `document.title`을 읽어 시각적으로 숨겨진 `aria-live="polite"` 영역에 안내 문구를 넣고, 키보드 포커스를 `#main`으로 옮깁니다. 제목은 각 페이지의 `usePageMeta()`가 설정하므로 한 프레임 지연으로 최신 값을 읽습니다.
  - 최초 페인트와 in-page 해시(`#section`) 이동에서는 포커스를 가로채지 않습니다.
  - 안내 문구는 `nav` 네임스페이스의 `routeChange.announce` / `routeChange.announceGeneric` 키를 사용하며, en/ko 양쪽에 동일 키가 있어야 합니다(`i18n/locales.test.ts`가 키 정합성을 검증).
- **모션/대비 선호 존중**: 애니메이션은 `prefers-reduced-motion`, 보더/포커스 링은 `prefers-contrast: more`를 `index.css`에서 처리합니다. 새 인터랙션도 이 가드를 따릅니다.
- **다크 테마**: OKLCH 토큰 기반 라이트/다크 토큰과 `ThemeToggle`, `store/theme.ts`의 시스템 선호 리스너가 이미 갖춰져 있으니 색상은 토큰으로만 추가합니다.

## PR 체크리스트

- 변경 범위 요약
- 영향 받는 도메인
- 실행한 검증 명령어 및 결과
- 회귀 확인 항목
