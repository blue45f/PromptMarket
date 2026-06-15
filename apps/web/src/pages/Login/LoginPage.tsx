import AuthLayout from '@components/AuthLayout'
import GoogleSignInButton from '@components/GoogleSignInButton'
import { Field, Input } from '@components/ui'
import { useAuthConfig, useGoogleLogin, useLogin } from '@domains/marketplace/queries'
import { usePageMeta } from '@hooks/usePageMeta'
import { LoginSchema, type LoginInput } from '@promptmarket/shared'
import { zodFormResolver } from '@utils/zodFormResolver'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

interface LocationState {
  from?: string
}

const PROMPTMARKET_DEMO_LOG_KEY = 'promptmarket-auth-demo-log-v1'

const appendDemoLog = (label: string, detail?: string) => {
  if (typeof window === 'undefined') return
  try {
    const raw = globalThis.localStorage.getItem(PROMPTMARKET_DEMO_LOG_KEY)
    const current = raw
      ? (JSON.parse(raw) as Array<{ at: number; label: string; detail?: string }>)
      : []
    globalThis.localStorage.setItem(
      PROMPTMARKET_DEMO_LOG_KEY,
      JSON.stringify([...current, { at: Date.now(), label, detail }].slice(-40))
    )
  } catch {
    return
  }
}

const DEMO_ACCOUNTS: Array<{ email: string; roleKey: string }> = [
  { email: 'alice@example.com', roleKey: 'demo.roles.seller' },
  { email: 'bob@example.com', roleKey: 'demo.roles.buyer' },
  { email: 'carol@example.com', roleKey: 'demo.roles.both' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from ?? '/'
  const loginMut = useLogin()
  const authConfig = useAuthConfig()
  const googleLogin = useGoogleLogin()
  const { t } = useTranslation('auth')

  const onGoogleCredential = (credential: string) => {
    googleLogin.mutate(credential, {
      onSuccess: () => navigate(from, { replace: true }),
    })
  }

  usePageMeta({
    title: t('login.meta.title'),
    description: t('login.meta.description'),
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodFormResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await loginMut.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      })
      navigate(from, { replace: true })
    } catch {
      /* toast handled in hook */
    }
  })

  const [demoClicks, setDemoClicks] = useState(0)
  const demoReadiness = useMemo(
    () => [
      { label: '시드 계정 선택', done: demoClicks > 0 },
      { label: '구매자/판매자 역할 비교', done: demoClicks >= 2 },
      { label: '약관 문구 확인', done: true },
    ],
    [demoClicks]
  )
  const demoRate = Math.round(
    (demoReadiness.filter((item) => item.done).length / demoReadiness.length) * 100
  )
  const busy = isSubmitting || loginMut.isPending

  return (
    <AuthLayout
      kicker={t('login.kicker')}
      title={
        <>
          {t('login.titlePrefix')}{' '}
          <span className="relative inline-block">
            <span className="relative z-10">{t('login.titleHighlight')}</span>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-[0.14em] h-[0.42em] bg-volt-300 dark:bg-volt-500/80 -z-0 -skew-x-6"
            />
          </span>
          .
        </>
      }
      highlight={
        <>
          {t('panel.loginHighlightLine1')}
          <br className="hidden sm:block" />
          {t('panel.loginHighlightLine2')}
        </>
      }
      description={t('login.description')}
      altPrompt={
        <>
          {t('login.altPrompt')}
          <Link
            to="/register"
            className="text-ink dark:text-bone font-medium underline underline-offset-[3px] decoration-volt-400 hover:decoration-volt-500"
          >
            {t('login.altPromptLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label={t('common.email')} error={errors.email ? t('validation.email') : undefined}>
          {(control) => (
            <Input
              {...control}
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder={t('common.emailPlaceholder')}
              invalid={Boolean(errors.email)}
            />
          )}
        </Field>
        <Field
          label={t('common.password')}
          error={errors.password ? t('validation.passwordRequired') : undefined}
        >
          {(control) => (
            <Input
              {...control}
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              invalid={Boolean(errors.password)}
            />
          )}
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="group relative w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight overflow-hidden motion-safe:transition ease-expo focus-volt disabled:opacity-60"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform ease-expo motion-safe:duration-500 group-hover:translate-y-0"
          />
          <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors ease-expo">
            {busy && <Loader2 aria-hidden className="w-4 h-4 motion-safe:animate-spin" />}
            {busy ? t('login.submitting') : t('login.submit')}
          </span>
        </button>
      </form>

      {authConfig.data?.googleClientId && (
        <div className="mt-6">
          <div className="flex items-center gap-3 text-[0.72rem] text-ink-mute dark:text-bone-mute">
            <span className="h-px flex-1 bg-line dark:bg-night-line" />
            {t('login.orDivider')}
            <span className="h-px flex-1 bg-line dark:bg-night-line" />
          </div>
          <div className="mt-4">
            <GoogleSignInButton
              clientId={authConfig.data.googleClientId}
              onCredential={onGoogleCredential}
            />
          </div>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-line dark:border-night-line">
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute mb-2.5">
          {t('demo.title')}
        </p>
        <ul className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((d) => (
            <li key={d.email}>
              <button
                type="button"
                onClick={() => {
                  setValue('email', d.email, { shouldValidate: false })
                  setValue('password', 'password', { shouldValidate: false })
                  setDemoClicks((count) => count + 1)
                  appendDemoLog('데모 계정 선택', d.email)
                }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] border border-line dark:border-night-line bg-canvas dark:bg-night hover:border-volt-400 dark:hover:border-volt-500/60 text-ink-soft dark:text-bone-soft motion-safe:transition ease-expo focus-volt"
                title={`${d.email} / password`}
              >
                <span className="font-mono">@{d.email.split('@')[0]}</span>
                <span className="text-ink-mute dark:text-bone-mute">·</span>
                <span>{t(d.roleKey)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-2xl border border-line dark:border-night-line bg-canvas/80 dark:bg-night/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
              Demo checklist
            </p>
            <span className="font-mono text-xs text-ink dark:text-bone">{demoRate}%</span>
          </div>
          <div className="mt-2 grid gap-1.5">
            {demoReadiness.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-line/70 dark:border-night-line/70 px-2.5 py-1.5 text-[0.72rem]"
              >
                <span className="text-ink-soft dark:text-bone-soft">{item.label}</span>
                <span
                  className={
                    item.done
                      ? 'text-volt-600 dark:text-volt-300'
                      : 'text-ink-mute dark:text-bone-mute'
                  }
                >
                  {item.done ? '완료' : '대기'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
