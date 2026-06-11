import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { cn } from '@utils/cn'

export interface GalleryAttachment {
  id: string
  dataUrl: string
  width?: number | null
  height?: number | null
}

interface AttachmentGalleryProps {
  attachments: GalleryAttachment[]
  /** Compact thumbnails for comment rows, regular for post bodies. */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Screenshot strip with a zoom dialog. Thumbnails are buttons (not links)
 * because data URLs cannot open in a new tab; the dialog shows the full
 * resized image instead.
 */
export default function AttachmentGallery({
  attachments,
  size = 'md',
  className,
}: AttachmentGalleryProps) {
  const { t } = useTranslation('common')
  const [openId, setOpenId] = useState<string | null>(null)

  if (attachments.length === 0) return null
  const open = attachments.find((a) => a.id === openId) ?? null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {attachments.map((attachment, index) => (
        <button
          key={attachment.id}
          type="button"
          onClick={() => setOpenId(attachment.id)}
          aria-label={t('attachments.openLabel', { index: index + 1 })}
          className="group rounded-lg focus-volt"
        >
          <img
            src={attachment.dataUrl}
            alt={t('attachments.imageAlt', { index: index + 1 })}
            loading="lazy"
            className={cn(
              'rounded-lg border border-line dark:border-night-line object-cover group-hover:border-volt-400 dark:group-hover:border-volt-500/60 motion-safe:transition ease-expo',
              size === 'sm' ? 'h-14 w-14' : 'h-24 w-24'
            )}
          />
        </button>
      ))}

      <Dialog.Root open={!!open} onOpenChange={(next) => !next && setOpenId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/80 motion-safe:animate-fade-in" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,64rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl bg-canvas p-3 shadow-2xl dark:bg-night focus:outline-none"
          >
            <Dialog.Title className="sr-only">{t('attachments.dialogTitle')}</Dialog.Title>
            {open && (
              <img
                src={open.dataUrl}
                alt={t('attachments.dialogTitle')}
                className="mx-auto max-h-[78vh] w-auto rounded-lg"
              />
            )}
            <Dialog.Close
              aria-label={t('attachments.closeLabel')}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-bone hover:bg-ink dark:bg-bone/80 dark:text-ink dark:hover:bg-bone motion-safe:transition ease-expo focus-volt"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
