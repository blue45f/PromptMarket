import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { ATTACHMENTS_PER_POST, type AttachmentInput as AttachmentDraft } from '@promptmarket/shared'
import { AttachmentError, prepareImageAttachment } from '@utils/image'
import { cn } from '@utils/cn'

interface AttachmentInputProps {
  value: AttachmentDraft[]
  onChange: (next: AttachmentDraft[]) => void
  disabled?: boolean
  className?: string
}

/**
 * Screenshot picker for reviews and discussions. Files are resized to
 * ≤1600px and re-encoded client-side, so what leaves the browser is already
 * within the 2MB server cap. Errors stay inline (no toast) because the picker
 * usually sits inside a larger form.
 */
export default function AttachmentInput({
  value,
  onChange,
  disabled,
  className,
}: AttachmentInputProps) {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorId = useId()

  const full = value.length >= ATTACHMENTS_PER_POST

  function messageFor(err: unknown): string {
    if (err instanceof AttachmentError) {
      if (err.code === 'too-large') return t('attachments.tooLarge')
      if (err.code === 'not-image') return t('attachments.notImage')
    }
    return t('attachments.processFailed')
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setProcessing(true)
    try {
      const room = ATTACHMENTS_PER_POST - value.length
      const picked = Array.from(files).slice(0, room)
      const prepared: AttachmentDraft[] = []
      for (const file of picked) {
        prepared.push(await prepareImageAttachment(file))
      }
      if (files.length > room) setError(t('attachments.limit', { max: ATTACHMENTS_PER_POST }))
      onChange([...value, ...prepared])
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((draft, index) => (
          <span key={`${index}-${draft.dataUrl.slice(-24)}`} className="relative inline-flex">
            <img
              src={draft.dataUrl}
              alt={t('attachments.previewAlt', { index: index + 1 })}
              className="h-16 w-16 rounded-lg border border-line dark:border-night-line object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              disabled={disabled}
              aria-label={t('attachments.removeLabel', { index: index + 1 })}
              className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-bone dark:bg-bone dark:text-ink shadow-sm hover:bg-coral-deep dark:hover:bg-coral motion-safe:transition ease-expo focus-volt"
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || processing}
            className="inline-flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line dark:border-night-line text-ink-mute dark:text-bone-mute hover:border-volt-400 hover:text-ink dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
            ) : (
              <ImagePlus aria-hidden="true" className="h-4 w-4" />
            )}
            <span className="text-[0.6rem] font-medium">{t('attachments.add')}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          aria-label={t('attachments.inputLabel')}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => void handleFiles(event.target.files)}
          disabled={disabled || processing || full}
        />
      </div>
      <p className="text-[0.7rem] text-ink-mute dark:text-bone-mute">
        {t('attachments.hint', { max: ATTACHMENTS_PER_POST })}
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-coral-deep dark:text-coral">
          {error}
        </p>
      )}
    </div>
  )
}
