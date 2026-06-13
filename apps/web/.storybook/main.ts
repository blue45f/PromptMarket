import path from 'path'
import { fileURLToPath } from 'url'

import babel from '@rolldown/plugin-babel'
import { reactCompilerPreset } from '@vitejs/plugin-react'

import type { StorybookConfig } from '@storybook/react-vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const r = (p: string) => path.resolve(__dirname, '..', p)

/**
 * Storybook (React + Vite) for @promptmarket/web.
 *
 * Mirrors the app's vite.config.ts: the same path aliases plus the React
 * Compiler Babel pass (React 19.2 native) so stories run the exact same
 * transform the app does. Tailwind v4 + the design tokens load via the app's
 * index.css, imported once in preview.tsx.
 */
const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-themes'],
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  async viteFinal(viteConfig) {
    viteConfig.resolve = viteConfig.resolve ?? {}
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias ?? {}),
      '@': r('src'),
      '@app': r('src/app'),
      '@components': r('src/components'),
      '@domains': r('src/domains'),
      '@hooks': r('src/hooks'),
      '@pages': r('src/pages'),
      '@router': r('src/router'),
      '@infrastructure': r('src/infrastructure'),
      '@store': r('src/store'),
      '@types': r('src/types'),
      '@utils': r('src/utils'),
    }
    // tailwindcss() is already supplied by the app's vite config that Storybook
    // extends; only the React Compiler Babel pass needs re-adding here.
    viteConfig.plugins = viteConfig.plugins ?? []
    viteConfig.plugins.push(babel({ presets: [reactCompilerPreset()] }))
    return viteConfig
  },
}

export default config
