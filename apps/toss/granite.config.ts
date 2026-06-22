import { defineConfig } from '@apps-in-toss/web-framework/config'

// 프롬프트·CLAUDE.md·스킬 마켓. 비게임=partner. 디지털 콘텐츠=인앱결제 대상.
export default defineConfig({
  appName: 'promptmarket',
  brand: { displayName: '프롬프트마켓', primaryColor: '#A78BFA', icon: '' },
  web: { host: 'localhost', port: 5185, commands: { dev: 'vite', build: 'vite build' } },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  outdir: 'dist',
  webViewProps: { type: 'partner' },
  navigationBar: { withBackButton: true, withHomeButton: true },
})
