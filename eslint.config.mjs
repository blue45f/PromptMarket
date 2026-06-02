import js from '@eslint/js'
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
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // react-hooks v7 ships React Compiler lint rules that default to error.
      // They flag working-but-not-Compiler-ideal patterns (effect setState,
      // ref reads, RHF watch(), Date.now in render) that would need broad
      // manual refactors with no behavior change. Mirror the sibling resume
      // repo and keep them as advisory warnings, not a hard gate.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/incompatible-library': 'warn',
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
      // The api tsconfig sets noImplicitAny:false; Nest/Prisma plumbing leans
      // on `any` in a few spots, so keep it a warning rather than an error.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
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
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
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
])
