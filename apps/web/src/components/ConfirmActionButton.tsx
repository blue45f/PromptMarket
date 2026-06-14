import { cn } from '@utils/cn'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmActionButtonProps {
  label: string
  /** Question shown in the armed state, e.g. "정말 삭제할까요?" */
  confirmLabel: string
  onConfirm: () => void | Promise<unknown>
  pending?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  className?: string
}

/**
 * Two-step destructive action: first click arms the button, second click
 * commits. Replaces window.confirm (banned by lint) without pulling a whole
 * dialog into dense admin tables. Disarms itself after a few seconds so a
 * forgotten armed button cannot be triggered by a stray click.
 */
export default function ConfirmActionButton({
  label,
  confirmLabel,
  onConfirm,
  pending,
  disabled,
  icon,
  className,
}: ConfirmActionButtonProps) {
  const { t } = useTranslation('common')
  const [armed, setArmed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function arm() {
    setArmed(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setArmed(false), 4000)
  }

  async function commit() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setArmed(false)
    await onConfirm()
  }

  if (armed) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <button
          type="button"
          onClick={() => void commit()}
          disabled={pending || disabled}
          className="inline-flex min-h-8 items-center gap-1 rounded-full bg-coral-deep px-3 py-1 text-xs font-semibold text-white disabled:opacity-60 motion-safe:transition ease-expo focus-volt"
        >
          {pending && <Loader2 aria-hidden="true" className="h-3 w-3 motion-safe:animate-spin" />}
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="inline-flex min-h-8 items-center rounded-full px-2 py-1 text-xs font-medium text-ink-soft hover:text-ink dark:text-bone-soft dark:hover:text-bone focus-volt"
        >
          {t('confirm.cancel')}
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={arm}
      disabled={pending || disabled}
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-coral/60 hover:text-coral-deep disabled:cursor-not-allowed disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:text-coral motion-safe:transition ease-expo focus-volt',
        className
      )}
    >
      {icon}
      {label}
    </button>
  )
}
