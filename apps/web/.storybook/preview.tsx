import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { withThemeByClassName } from '@storybook/addon-themes'

import type { Preview } from '@storybook/react-vite'

// Side-effect import: boots i18next (ko + en resources) so components that call
// useTranslation() render real copy instead of raw keys.
import '../src/i18n'
// Tailwind v4 + the full OKLCH design-token layer (light + .dark). One import
// gives every story the app's real surfaces, type scale, and dark mode.
import '../src/index.css'

// A single, retry-free client so cards/carousels that read the query cache
// (prefetch-on-hover, etc.) mount without throwing in isolation.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      // 'todo' surfaces a11y findings in the panel without failing the build.
      test: 'todo',
    },
    backgrounds: { disable: true },
    layout: 'centered',
  },
  decorators: [
    // Theme switcher in the toolbar toggles the `dark` class on <html>, which
    // is exactly the signal src/store/theme.ts and the index.html bootstrap use.
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
    // App-level providers every story can rely on: i18n is global (import
    // above), Router + React Query are wrapped here.
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="bg-canvas text-ink dark:bg-night dark:text-bone p-6 rounded-xl">
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
}

export default preview
