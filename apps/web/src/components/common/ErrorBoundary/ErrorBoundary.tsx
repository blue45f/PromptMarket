import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

/**
 * Functional fallback so the boundary can use i18n (class components can't call hooks).
 * Mirrors RouteError's surface-card treatment; i18next is a global singleton, so
 * useTranslation works here even though this renders above the router tree.
 */
function ErrorBoundaryFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation('errors')

  return (
    <main
      role="alert"
      className="min-h-screen text-ink dark:text-bone flex items-center justify-center px-[clamp(1.25rem,4vw,3rem)]"
    >
      <section className="w-full max-w-lg rounded-3xl border border-line dark:border-night-line surface-card p-8 shadow-xl shadow-ink/5 dark:shadow-black/30">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-coral-deep dark:text-coral inline-flex items-center gap-2">
          <span aria-hidden className="w-5 h-px bg-coral" />
          {t('boundary.eyebrow')}
        </p>
        <h1 className="mt-3 font-display text-[1.8rem] font-bold tracking-[-0.03em] leading-tight">
          {t('boundary.title')}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft dark:text-bone-soft">
          {t('boundary.message')}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink px-5 py-2.5 text-sm font-semibold focus-volt lift-on-hover"
          >
            {t('boundary.retry')}
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/'
            }}
            className="inline-flex items-center gap-2 rounded-full border border-line dark:border-night-line px-5 py-2.5 text-sm font-semibold focus-volt lift-on-hover"
          >
            {t('boundary.home')}
          </button>
        </div>
      </section>
    </main>
  )
}

/**
 * Component-level error boundary. The router's errorElement only catches errors inside
 * its route tree; this guards render throws that escape it (lazy chunk load failures,
 * provider-tree exceptions) from blanking the whole SPA. Boundaries must be classes.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hook point for monitoring; logged for debugging without surfacing internals to users.
    console.error('Unhandled render error:', error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      return <ErrorBoundaryFallback onReset={this.handleReset} />
    }

    return this.props.children
  }
}

export default ErrorBoundary
