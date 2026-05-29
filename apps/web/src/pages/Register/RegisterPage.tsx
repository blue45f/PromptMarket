import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterSchema, type RegisterInput } from '@promptmarket/shared'
import { Loader2 } from 'lucide-react'
import { useRegister } from '@features/marketplace/queries'
import { usePageMeta } from '@hooks/usePageMeta'
import AuthLayout from '@components/AuthLayout'
import { cn } from '@utils/cn'

const inputClass = cn(
  'w-full rounded-xl px-3.5 py-2.5 text-sm',
  'border border-line dark:border-night-line',
  'bg-canvas dark:bg-night text-ink dark:text-bone',
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
  'motion-safe:transition',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500'
)

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerMut = useRegister()
  const { t } = useTranslation('auth')

  usePageMeta({
    title: t('register.meta.title'),
    description: t('register.meta.description'),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: '', username: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMut.mutateAsync({
        email: values.email.trim(),
        username: values.username.trim(),
        password: values.password,
      })
      navigate('/', { replace: true })
    } catch {
      /* toast handled in hook */
    }
  })

  const busy = isSubmitting || registerMut.isPending

  return (
    <AuthLayout
      kicker={t('register.kicker')}
      title={
        <>
          {t('register.titlePrefix')}{' '}
          <span className="relative inline-block">
            <span className="relative z-10">{t('register.titleHighlight')}</span>
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
          {t('panel.registerHighlightLine1')}
          <br className="hidden sm:block" />
          {t('panel.registerHighlightLine2')}
        </>
      }
      description={t('register.description')}
      altPrompt={
        <>
          {t('register.altPrompt')}
          <Link
            to="/login"
            className="text-ink dark:text-bone font-medium underline underline-offset-[3px] decoration-volt-400 hover:decoration-volt-500"
          >
            {t('register.altPromptLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5">
            {t('common.email')}
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder={t('common.emailPlaceholder')}
            {...register('email')}
            className={inputClass}
          />
          {errors.email && (
            <p className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral">
              {t('validation.email')}
            </p>
          )}
        </div>
        <div>
          <label className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5">
            {t('register.username')}
          </label>
          <input
            type="text"
            autoComplete="username"
            placeholder={t('register.usernamePlaceholder')}
            {...register('username')}
            className={inputClass}
          />
          {errors.username && (
            <p className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral">
              {t('validation.username')}
            </p>
          )}
          <p className="mt-1 text-[0.72rem] text-ink-mute dark:text-bone-mute">
            {t('register.usernameHintPrefix')}
            <span className="font-mono">{t('register.usernameHintToken')}</span>
          </p>
        </div>
        <div>
          <label className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5">
            {t('common.password')}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={t('register.passwordPlaceholder')}
            {...register('password')}
            className={inputClass}
          />
          {errors.password && (
            <p className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral">
              {t('validation.password')}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="group relative w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight overflow-hidden motion-safe:transition focus-volt disabled:opacity-60"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
          />
          <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors">
            {busy && <Loader2 className="w-4 h-4 motion-safe:animate-spin" />}
            {busy ? t('register.submitting') : t('register.submit')}
          </span>
        </button>

        <p className="text-[0.72rem] text-ink-mute dark:text-bone-mute leading-relaxed">
          {t('register.terms')}
        </p>
      </form>
    </AuthLayout>
  )
}
