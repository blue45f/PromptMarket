import { Button, Field, Input } from '@components/ui'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@utils/cn'
import { Loader2, LogIn, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { useAuth } from './useAuth'

type Mode = 'signin' | 'signup'

const COPY: Record<Mode, { title: string; desc: string; submit: string; toggle: string }> = {
  signin: {
    title: '회원 로그인',
    desc: '이메일과 비밀번호로 로그인하세요. 계정이 없다면 가입하거나 게스트로 시작할 수 있습니다.',
    submit: '로그인',
    toggle: '계정이 없나요? 가입하기',
  },
  signup: {
    title: '회원가입',
    desc: '이메일과 비밀번호로 새 계정을 만드세요. 비밀번호는 6자 이상이어야 합니다.',
    submit: '가입하기',
    toggle: '이미 계정이 있나요? 로그인',
  },
}

/**
 * Firebase 이메일/비밀번호 + 게스트 로그인 다이얼로그 — 접근성 우선.
 * - 로그인 ⇄ 가입 토글, "게스트로 시작하기"(익명 인증)
 * - 로딩/비활성 상태, aria-live 에러(role="alert")
 * - 포커스: Radix Dialog 가 트랩, 열릴 때 이메일 입력에 초기 포커스
 *
 * PromptMarket 디자인 토큰/프리미티브(Radix Dialog·Field·Input·Button)에만 의존한다.
 * useAuth API 와 한국어 에러 매핑은 형제 앱 벤더링 단일 소스와 동일하게 유지한다.
 */
export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { signIn, signUp, signInAsGuest, error, clearError, user } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'form' | 'guest' | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // 로그인 성공 시 자동으로 닫힌다(prop 콜백 호출 — setState 아님).
  useEffect(() => {
    if (open && user) onOpenChange(false)
  }, [open, user, onOpenChange])

  /**
   * 닫힘 전이를 가로채 폼/에러를 초기화한다 — 다음 열림이 항상 깨끗한 상태로 시작.
   * (effect 내 동기 setState 를 피하려는 의도. Radix 는 외부 open prop 변경 시
   * onOpenChange 를 호출하지 않으므로, 닫을 때 정리하는 편이 신뢰성 있다.)
   */
  function handleOpenChange(next: boolean) {
    if (!next) {
      setMode('signin')
      setBusy(null)
      setEmail('')
      setPassword('')
      clearError()
    }
    onOpenChange(next)
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    clearError()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy('form')
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
    } catch {
      // 에러는 컨텍스트 state(error)로 노출 — 여기선 무시.
    } finally {
      setBusy(null)
    }
  }

  async function onGuest() {
    if (busy) return
    setBusy('guest')
    try {
      await signInAsGuest()
    } catch {
      // 위와 동일.
    } finally {
      setBusy(null)
    }
  }

  const copy = COPY[mode]
  const formBusy = busy === 'form'
  const guestBusy = busy === 'guest'
  const anyBusy = busy !== null

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // 기본 포커스(닫기 버튼) 대신 이메일 입력으로.
            e.preventDefault()
            emailRef.current?.focus()
          }}
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(26rem,calc(100vw-2rem))]',
            'rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night shadow-2xl shadow-ink/40',
            'p-6 sm:p-7',
            'data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="inline-flex w-9 h-9 rounded-xl bg-ink dark:bg-bone text-volt-300 dark:text-ink items-center justify-center"
              >
                {mode === 'signup' ? (
                  <UserPlus className="w-4 h-4" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
              </span>
              <div>
                <Dialog.Title className="font-display text-[1.1rem] font-semibold text-ink dark:text-bone leading-none tracking-tight">
                  {copy.title}
                </Dialog.Title>
                <Dialog.Description className="text-[0.78rem] text-ink-mute dark:text-bone-mute leading-snug mt-1 max-w-[28ch]">
                  {copy.desc}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="닫기"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub motion-safe:transition ease-expo focus-volt"
              >
                <X aria-hidden className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
            <Field label="이메일" required>
              {(control) => (
                <Input
                  {...control}
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={anyBusy}
                />
              )}
            </Field>

            <Field label="비밀번호" required>
              {(control) => (
                <Input
                  {...control}
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  disabled={anyBusy}
                />
              )}
            </Field>

            {/* 에러는 항상 같은 노드에 두어 aria-live 가 안정적으로 announce 한다. */}
            <div aria-live="assertive">
              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-[0.8rem] text-coral-deep dark:text-coral"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={anyBusy || !email || !password}
              aria-busy={formBusy || undefined}
            >
              {formBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {copy.submit}
            </Button>
          </form>

          <button
            type="button"
            onClick={switchMode}
            disabled={anyBusy}
            className="mt-3 w-full text-center text-[0.8rem] font-medium text-volt-700 dark:text-volt-300 hover:underline motion-safe:transition disabled:pointer-events-none disabled:opacity-50"
          >
            {copy.toggle}
          </button>

          <div className="my-3 flex items-center gap-3 text-ink-mute dark:text-bone-mute">
            <span className="h-px flex-1 bg-line dark:bg-night-line" aria-hidden />
            <span className="text-xs">또는</span>
            <span className="h-px flex-1 bg-line dark:bg-night-line" aria-hidden />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGuest}
            disabled={anyBusy}
            aria-busy={guestBusy || undefined}
          >
            {guestBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
            게스트로 시작하기
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
