/// <reference types="vitest/config" />
import path from 'path'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // React Compiler (React 19.2 native) runs via Babel for apps/web.
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@components': path.resolve(__dirname, './src/components'),
      '@domains': path.resolve(__dirname, './src/domains'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@router': path.resolve(__dirname, './src/router'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  optimizeDeps: {
    // The @heejun/deskcloud SDK declares socket.io-client as an OPTIONAL peer
    // dep (only the Realtime/Chat clients need it — we never import those). Vite's
    // dep pre-bundler would otherwise try to resolve that optional import from the
    // SDK barrel and fail. Excluding it from optimization lets Vite process the SDK
    // on demand and tree-shake the unused socket path (the prod build already does).
    exclude: ['@heejun/deskcloud'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Sitemap is exposed at /sitemap.xml in prod (via nginx). Mirror the
      // rewrite locally so search-console previews work in dev too.
      '/sitemap.xml': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: () => '/api/seo/sitemap.xml',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor'
          }
          if (id.includes('node_modules/react-router')) {
            return 'router'
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query'
          }
          if (
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform/') ||
            id.includes('node_modules/zod')
          ) {
            return 'form'
          }
          if (
            id.includes('node_modules/react-markdown') ||
            id.includes('node_modules/remark-gfm')
          ) {
            return 'markdown'
          }
        },
      },
    },
  },
})
