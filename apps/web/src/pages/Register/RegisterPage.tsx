import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
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
  'motion-safe:transition ease-expo',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500'
)
/* Consent fine print links — legal pages are internal routes (/terms, /privacy). */
const consentLinkClass = cn(
  'underline underline-offset-2 decoration-volt-400 hover:decoration-volt-500',
  'hover:text-ink dark:hover:text-bone motion-safe:transition-colors ease-expo'
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

  const [termsChecked, setTermsChecked] = useState({ service: false, privacy: false })
  const [termsError, setTermsError] = useState(false)
  const canSubmit = termsChecked.service && termsChecked.privacy
  const busy = isSubmitting || registerMut.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (!canSubmit) {
      setTermsError(true)
      return
    }

    setTermsError(false)

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
          <label
            htmlFor="register-email"
            className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5"
          >
            {t('common.email')}
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder={t('common.emailPlaceholder')}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            {...register('email')}
            className={inputClass}
          />
          {errors.email && (
            <p
              id="register-email-error"
              role="alert"
              className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
            >
              {t('validation.email')}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="register-username"
            className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5"
          >
            {t('register.username')}
          </label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            placeholder={t('register.usernamePlaceholder')}
            aria-invalid={errors.username ? true : undefined}
            aria-describedby={
              errors.username
                ? 'register-username-error register-username-hint'
                : 'register-username-hint'
            }
            {...register('username')}
            className={inputClass}
          />
          {errors.username && (
            <p
              id="register-username-error"
              role="alert"
              className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
            >
              {t(
                `validation.username.${
                  errors.username.type === 'too_small'
                    ? 'tooShort'
                    : errors.username.type === 'too_big'
                      ? 'tooLong'
                      : 'format'
                }`
              )}
            </p>
          )}
          <p
            id="register-username-hint"
            className="mt-1 text-[0.72rem] text-ink-mute dark:text-bone-mute"
          >
            {t('register.usernameHintPrefix')}
            <span className="font-mono">{t('register.usernameHintToken')}</span>
          </p>
        </div>
        <div>
          <label
            htmlFor="register-password"
            className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5"
          >
            {t('common.password')}
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder={t('register.passwordPlaceholder')}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            {...register('password')}
            className={inputClass}
          />
          {errors.password && (
            <p
              id="register-password-error"
              role="alert"
              className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
            >
              {t(
                `validation.password.${errors.password.type === 'too_big' ? 'tooLong' : 'tooShort'}`
              )}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-line dark:border-night-line bg-canvas/70 dark:bg-night/70 p-3 text-[0.78rem] text-ink-soft dark:text-bone-soft">
          <p className="font-medium text-ink dark:text-bone mb-2">가입 전 확인</p>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={termsChecked.service}
              onChange={(event) => {
                setTermsChecked((current) => ({ ...current, service: event.target.checked }))
                if (event.target.checked && termsChecked.privacy) setTermsError(false)
              }}
              className="mt-0.5"
            />
            <span>마켓 거래 규칙과 프롬프트 저작권·환불 기준을 확인했습니다.</span>
          </label>
          <label className="mt-2 flex items-start gap-2">
            <input
              type="checkbox"
              checked={termsChecked.privacy}
              onChange={(event) => {
                setTermsChecked((current) => ({ ...current, privacy: event.target.checked }))
                if (event.target.checked && termsChecked.service) setTermsError(false)
              }}
              className="mt-0.5"
            />
            <span>계정·결제·거래 알림에 필요한 개인정보 처리 범위를 확인했습니다.</span>
          </label>
          {termsError && (
            <p role="alert" className="mt-2 text-[0.76rem] text-coral-deep dark:text-coral">
              두 확인 항목을 모두 체크해야 계정을 만들 수 있어요.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          aria-disabled={!canSubmit ? true : undefined}
          className="group relative w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight overflow-hidden motion-safe:transition ease-expo focus-volt disabled:opacity-60"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform ease-expo motion-safe:duration-500 group-hover:translate-y-0"
          />
          <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors ease-expo">
            {busy && <Loader2 aria-hidden className="w-4 h-4 motion-safe:animate-spin" />}
            {busy ? t('register.submitting') : t('register.submit')}
          </span>
        </button>

        <p className="text-[0.72rem] text-ink-mute dark:text-bone-mute leading-relaxed">
          <Trans
            t={t}
            i18nKey="register.terms"
            components={{
              terms: <Link to="/terms" className={consentLinkClass} />,
              privacy: <Link to="/privacy" className={consentLinkClass} />,
            }}
          />
        </p>
      </form>
    </AuthLayout>
  )
}
