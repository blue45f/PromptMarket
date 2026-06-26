import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'promptmarket',
  brand: {
    primaryColor: '#A78BFA',
  },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  webView: {},
  webBundleDir: 'dist',
  navigationBar: { withBackButton: true, withHomeButton: true },
})
