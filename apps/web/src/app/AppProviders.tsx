import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
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
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
