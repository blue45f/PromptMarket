import { ErrorBoundary } from '@components/common/ErrorBoundary/ErrorBoundary'
import { FeedbackWidget } from '@components/feedback/FeedbackWidget'
import { router } from '@router/index'
import { initTheme } from '@store/theme'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { appQueryClient } from './queryClient'

initTheme()

export default function AppProviders() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <Toaster
        position="top-right"
        gap={10}
        toastOptions={{
          duration: 3000,
          // Base toast — neutral surface, matches the design system tokens.
          style: {
            borderRadius: '14px',
            padding: '10px 14px',
            boxShadow:
              '0 18px 40px -18px oklch(0.16 0.03 290 / 0.35), 0 4px 10px -4px oklch(0.16 0.03 290 / 0.18)',
            border: '1px solid var(--toast-border)',
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            fontFamily:
              '"Hanken Grotesk", "Pretendard Variable", "Pretendard", system-ui, sans-serif',
            fontSize: '0.86rem',
            lineHeight: 1.45,
            letterSpacing: '-0.005em',
          },
        }}
      />
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      {/* Shared SurveyDesk feedback widget — a fixed floating launcher rendered
          app-wide, outside the routed content. Gated on VITE_SURVEYDESK_URL so
          the app is completely unaffected while SurveyDesk is not yet deployed
          (env unset by default today). */}
      {import.meta.env.VITE_SURVEYDESK_URL && (
        <FeedbackWidget appId="promptmarket" endpoint={import.meta.env.VITE_SURVEYDESK_URL} />
      )}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
