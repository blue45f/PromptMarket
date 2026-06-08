import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema, type LoginInput } from '@promptmarket/shared'
import { Loader2 } from 'lucide-react'
import { useAuthConfig, useGoogleLogin, useLogin } from '@features/marketplace/queries'
import { usePageMeta } from '@hooks/usePageMeta'
import AuthLayout from '@components/AuthLayout'
import GoogleSignInButton from '@components/GoogleSignInButton'
import { cn } from '@utils/cn'

interface LocationState {
  from?: string
}

const inputClass = cn(
  'w-full rounded-xl px-3.5 py-2.5 text-sm',
  'border border-line dark:border-night-line',
  'bg-canvas dark:bg-night text-ink dark:text-bone',
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
  'motion-safe:transition ease-expo',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500'
)

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
    resolver: zodResolver(LoginSchema),
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
        <div>
          <label
            htmlFor="login-email"
            className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5"
          >
            {t('common.email')}
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={t('common.emailPlaceholder')}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
            className={inputClass}
          />
          {errors.email && (
            <p
              id="login-email-error"
              role="alert"
              className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
            >
              {t('validation.email')}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="login-password"
            className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5"
          >
            {t('common.password')}
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            {...register('password')}
            className={inputClass}
          />
          {errors.password && (
            <p
              id="login-password-error"
              role="alert"
              className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
            >
              {t('validation.passwordRequired')}
            </p>
          )}
        </div>

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
      </div>
    </AuthLayout>
  )
}
