import { base, react, plugin, defineConfig } from '@heejun/eslint-config'
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
        { name: 'confirm', message: '브랜드 확인 다이얼로그를 사용하세요 (window.confirm 금지).' },
        { name: 'alert', message: 'Toast/Dialog를 사용하세요 (window.alert 금지).' },
        { name: 'prompt', message: '입력 다이얼로그/폼을 사용하세요 (window.prompt 금지).' },
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
