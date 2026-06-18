import { Component, type ErrorInfo, type ReactNode } from 'react'

import { theme } from '../theme'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했어요.',
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[pickflow] render error', error, info)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          textAlign: 'center',
          color: theme.text,
          background: theme.bg,
        }}
      >
        <strong style={{ fontSize: 18 }}>화면을 불러오지 못했어요</strong>
        <p style={{ color: theme.textMuted, fontSize: 14, margin: 0 }}>{this.state.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            minHeight: 44,
            padding: '0 20px',
            borderRadius: 999,
            border: 'none',
            background: theme.accent,
            color: theme.accentInk,
            fontWeight: 700,
          }}
        >
          다시 시도
        </button>
      </div>
    )
  }
}
