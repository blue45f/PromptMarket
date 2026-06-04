import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { appQueryClient } from './queryClient'
import { router } from '@router/index'
import { initTheme } from '@store/theme'
import { ErrorBoundary } from '@components/common/ErrorBoundary/ErrorBoundary'

initTheme()

export default function AppProviders() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <Toaster
        position="top-right"
        gutter={10}
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
          // Success — lime check on canvas.
          success: {
            iconTheme: {
              primary: 'oklch(0.58 0.17 128)',
              secondary: 'oklch(0.975 0.012 95)',
            },
          },
          // Error — coral, never bright red.
          error: {
            iconTheme: {
              primary: 'oklch(0.6 0.18 35)',
              secondary: 'oklch(0.975 0.012 95)',
            },
          },
          // Loading spinner picks up the brand lime so it reads as "live"
          // rather than "neutral".
          loading: {
            iconTheme: {
              primary: 'oklch(0.74 0.21 126)',
              secondary: 'oklch(0.205 0.024 290)',
            },
          },
        }}
      />
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
