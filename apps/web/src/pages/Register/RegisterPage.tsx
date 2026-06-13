import AuthLayout from '@components/AuthLayout'
import { Field, Input } from '@components/ui'
import { useRegister } from '@features/marketplace/queries'
import { usePageMeta } from '@hooks/usePageMeta'
import { RegisterSchema, type RegisterInput } from '@promptmarket/shared'
import { cn } from '@utils/cn'
import { zodFormResolver } from '@utils/zodFormResolver'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

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
    resolver: zodFormResolver(RegisterSchema),
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
        <Field
          id="register-email"
          label={t('common.email')}
          error={errors.email ? t('validation.email') : undefined}
        >
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
          id="register-username"
          label={t('register.username')}
          description={
            <>
              {t('register.usernameHintPrefix')}
              <span className="font-mono">{t('register.usernameHintToken')}</span>
            </>
          }
          error={
            errors.username
              ? t(
                  `validation.username.${
                    errors.username.type === 'too_small'
                      ? 'tooShort'
                      : errors.username.type === 'too_big'
                        ? 'tooLong'
                        : 'format'
                  }`
                )
              : undefined
          }
        >
          {(control) => (
            <Input
              {...control}
              {...register('username')}
              type="text"
              autoComplete="username"
              placeholder={t('register.usernamePlaceholder')}
              invalid={Boolean(errors.username)}
            />
          )}
        </Field>
        <Field
          id="register-password"
          label={t('common.password')}
          error={
            errors.password
              ? t(
                  `validation.password.${errors.password.type === 'too_big' ? 'tooLong' : 'tooShort'}`
                )
              : undefined
          }
        >
          {(control) => (
            <Input
              {...control}
              {...register('password')}
              type="password"
              autoComplete="new-password"
              placeholder={t('register.passwordPlaceholder')}
              invalid={Boolean(errors.password)}
            />
          )}
        </Field>

        <div className="rounded-2xl border border-line dark:border-night-line bg-canvas/70 dark:bg-night/70 p-3 text-[0.78rem] text-ink-soft dark:text-bone-soft">
          <p className="font-medium text-ink dark:text-bone mb-2">
            {t('register.consent.heading')}
          </p>
          <div className="flex items-start gap-2">
            <input
              id="register-consent-service"
              type="checkbox"
              checked={termsChecked.service}
              aria-invalid={termsError ? true : undefined}
              aria-describedby={termsError ? 'register-consent-error' : undefined}
              onChange={(event) => {
                setTermsChecked((current) => ({ ...current, service: event.target.checked }))
                if (event.target.checked && termsChecked.privacy) setTermsError(false)
              }}
              className="mt-0.5"
            />
            <label htmlFor="register-consent-service">
              <Trans
                t={t}
                i18nKey="register.consent.service"
                components={{
                  terms: (
                    <Link
                      to="/terms"
                      className={consentLinkClass}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ),
                }}
              />
            </label>
          </div>
          <div className="mt-2 flex items-start gap-2">
            <input
              id="register-consent-privacy"
              type="checkbox"
              checked={termsChecked.privacy}
              aria-invalid={termsError ? true : undefined}
              aria-describedby={termsError ? 'register-consent-error' : undefined}
              onChange={(event) => {
                setTermsChecked((current) => ({ ...current, privacy: event.target.checked }))
                if (event.target.checked && termsChecked.service) setTermsError(false)
              }}
              className="mt-0.5"
            />
            <label htmlFor="register-consent-privacy">
              <Trans
                t={t}
                i18nKey="register.consent.privacy"
                components={{
                  privacy: (
                    <Link
                      to="/privacy"
                      className={consentLinkClass}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ),
                }}
              />
            </label>
          </div>
          {termsError && (
            <p
              id="register-consent-error"
              role="alert"
              className="mt-2 text-[0.76rem] text-coral-deep dark:text-coral"
            >
              {t('register.consent.error')}
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
