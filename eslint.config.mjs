import { base, react, plugin, boundaries, defineConfig } from '@heejun/eslint-config'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'

// PromptMarket pnpm monorepo flat config. Adopts the shared
// @heejun/eslint-config (TS + import 위생 + React 19/RC + jsx-a11y + 커스텀
// 규칙 + prettier 충돌 비활성) as the single source of lint rules, then layers
// only the repo-specific overrides on top. Prettier owns formatting via the
// package.json "prettier" field + the `format:check` step; this config enforces
// correctness/quality only.
export default defineConfig(
  globalIgnores([
    '**/dist',
    '**/build',
    '**/coverage',
    '**/node_modules',
    '**/*.d.ts',
    '**/.turbo',
    'apps/api/prisma/migrations/**',
  ]),

  // 공유 베이스(TS + import 위생 + 커스텀 규칙 + prettier 충돌 비활성).
  base({ files: ['**/*.{ts,tsx}'] }),

  // apps/web — React 19 + Vite + RC + jsx-a11y.
  react({ files: ['apps/web/**/*.{ts,tsx}'] }),

  // heejun 개인 테스트/목 컨벤션 규칙은 비활성 — 횡단 일관성 대상이 아니라
  // PromptMarket 자체 테스트 스타일과 충돌한다(shared base 의 일반 규칙만 채택).
  {
    plugins: { '@heejun': plugin },
    rules: {
      '@heejun/vitest-mock-import': 'off',
      '@heejun/vitest-mock-import-original': 'off',
      '@heejun/mock-response-naming': 'off',
      '@heejun/no-js-interface-direct-access': 'off',
    },
  },

  // apps/web 레포 정책: 네이티브 confirm/alert/prompt 금지.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: '브랜드 확인 다이얼로그를 사용하세요 (globalThis.confirm 금지).' },
        { name: 'alert', message: 'Toast/Dialog를 사용하세요 (globalThis.alert 금지).' },
        { name: 'prompt', message: '입력 다이얼로그/폼을 사용하세요 (globalThis.prompt 금지).' },
      ],
    },
  },

  // 라우트 테이블은 lazy 컴포넌트 + router export 혼재.
  {
    files: ['apps/web/src/router/index.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // Storybook 스토리 — Story export 는 fast-refresh 컴포넌트가 아니다.
  {
    files: ['apps/web/src/**/*.stories.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // Storybook 설정(.storybook) — Node + ESM, fast-refresh 계약 없음.
  {
    files: ['apps/web/.storybook/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // apps/web 계층 경계 — app/domains/shared/infrastructure 4계층.
  // components/hooks/utils/store/i18n/types 는 물리적으로 옮기지 않고 shared 로 매핑한다.
  ...boundaries({
    files: ['apps/web/src/**/*.{ts,tsx}'],
    elements: [
      { type: 'app', pattern: 'apps/web/src/{app,router,pages}/**/*', mode: 'full' },
      { type: 'domains', pattern: 'apps/web/src/domains/*/**/*', mode: 'full' },
      {
        type: 'shared',
        pattern: 'apps/web/src/{components,hooks,utils,store,i18n,types}/**/*',
        mode: 'full',
      },
      { type: 'infrastructure', pattern: 'apps/web/src/infrastructure/**/*', mode: 'full' },
    ],
    rules: [
      { from: ['app'], allow: ['app', 'domains', 'shared', 'infrastructure'] },
      { from: ['domains'], allow: ['domains', 'shared', 'infrastructure'] },
      { from: ['infrastructure'], allow: ['shared', 'infrastructure'] },
      { from: ['shared'], allow: ['shared'] },
    ],
  }),
  // boundaries 는 TS 임포트를 분류하려면 리졸버가 필요하다(없으면 조용히 no-op).
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    settings: {
      'import/resolver': { typescript: { project: 'apps/web/tsconfig.json' }, node: true },
    },
  },
  // 기술부채 완화(차기 패스에서 도메인으로 이동 예정): components/ 루트의 일부 파일은
  // 사실상 도메인 결합 피처 컴포넌트라 domains/infrastructure 를 직접 import 한다
  // (marketplace 쿼리/queryKeys 를 쓰는 카드·캐러셀·검색팔레트·통계 위젯, admin 첨부
  // 패널, layout 헤더/네비의 알림·통계 상태). 이들을 도메인으로 물리 이동하는 것은
  // ListingCard 같은 공용 빌딩블록까지 얽힌 대규모 리팩터라 이번 패스 범위 밖이다.
  // pure shared(components/ui·common·route 의 나머지·hooks·utils·store·i18n·types)는
  // 계속 strict 하게 강제한다.
  {
    files: [
      'apps/web/src/components/AdminAttachmentsPanel.tsx',
      'apps/web/src/components/CommandPalette.tsx',
      'apps/web/src/components/Hero.tsx',
      'apps/web/src/components/ListingCard.tsx',
      'apps/web/src/components/ModelTabs.tsx',
      'apps/web/src/components/RecentlyViewed.tsx',
      'apps/web/src/components/RelatedListings.tsx',
      'apps/web/src/components/StatsStrip.tsx',
      'apps/web/src/components/layout/{Layout,Navbar}.tsx',
    ],
    rules: { 'boundaries/element-types': 'off' },
  },

  // apps/api — NestJS (Node). 데코레이터 + 빈 생성자/클래스 관용.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },

  // packages/shared — framework-agnostic (Node).
  {
    files: ['packages/shared/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // 테스트 — Vitest globals; fast-refresh 제약 완화.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser, ...globals.vitest } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-refresh/only-export-components': 'off',
    },
  }
)
