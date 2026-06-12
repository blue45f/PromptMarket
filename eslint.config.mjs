import js from '@eslint/js'
import reactCompiler from 'eslint-plugin-react-compiler'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Flat config for the PromptMarket pnpm monorepo. Modeled on the sibling
// resume repo (React 19 + Vite) for portfolio consistency, then widened to
// also cover the NestJS api and the shared package. Prettier owns formatting
// (see .prettierrc + the `format:check` step), so this config only enforces
// correctness/quality rules, not stylistic ones.
export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/build',
    '**/coverage',
    '**/node_modules',
    '**/*.d.ts',
    '**/.turbo',
    'apps/api/prisma/migrations/**',
  ]),

  // ── apps/web — React 19 + Vite ───────────────────────────────────────────
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2022 },
    },
    rules: {
      // 네이티브 window.confirm/alert/prompt 금지 — 브랜드 Dialog/Toast를 쓴다.
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: '브랜드 확인 다이얼로그를 사용하세요 (window.confirm 금지).' },
        { name: 'alert', message: 'Toast/Dialog를 사용하세요 (window.alert 금지).' },
        { name: 'prompt', message: '입력 다이얼로그/폼을 사용하세요 (window.prompt 금지).' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      // react-hooks v7 ships React Compiler lint rules; enforce them as hard gates.
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/static-components': 'error',
      'react-hooks/incompatible-library': 'error',
    },
  },

  // ── apps/api — NestJS (decorators, CommonJS) ─────────────────────────────
  {
    files: ['apps/api/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      // Nest/Prisma plumbing must stay explicitly typed under the strict gate.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // ── packages/shared — framework-agnostic TS ──────────────────────────────
  {
    files: ['packages/shared/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // ── Test files — relax fast-refresh & allow test-runner globals ──────────
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'apps/web/src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.vitest },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  // ── Storybook stories — a Story export is not a fast-refresh component ────
  {
    files: ['apps/web/src/**/*.stories.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // ── Storybook config (.storybook) — Node + ESM, no fast-refresh contract ──
  {
    files: ['apps/web/.storybook/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.es2022 },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // ── Root tooling / config files (Node, ESM or CJS) ───────────────────────
  {
    files: ['*.{js,mjs,cjs,ts}', 'scripts/**/*.{js,mjs,cjs}', '**/*.config.{js,mjs,cjs,ts}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
  },

  // ── React Compiler gate — apps/web must stay compilable ──────────────────
  // This rule runs the actual compiler frontend; an error means the component
  // bails out of React Compiler optimization entirely.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
])
