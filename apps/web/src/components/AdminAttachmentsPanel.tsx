import ConfirmActionButton from '@components/ConfirmActionButton'
import {
  useAdminAttachments,
  useAdminDeleteAttachment,
  type AttachmentTarget,
} from '@features/admin'
import { getErrorMessage } from '@services/api'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function formatKb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

/**
 * Expandable attachment strip inside the moderation tables. Data URLs are
 * heavy, so this only fetches once the moderator opens the panel.
 */
export default function AdminAttachmentsPanel({ target }: { target: AttachmentTarget }) {
  const { t } = useTranslation('admin')
  const { data, isPending, error } = useAdminAttachments(target, true)
  const deleteMut = useAdminDeleteAttachment()

  if (isPending) {
    return (
      <div className="flex gap-2 py-2" aria-busy="true">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-16 rounded-lg bg-canvas-deep dark:bg-night-deep motion-safe:animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p role="status" className="py-2 text-xs text-coral-deep dark:text-coral">
        {getErrorMessage(error)}
      </p>
    )
  }

  const attachments = data ?? []
  if (attachments.length === 0) {
    return (
      <p className="py-2 text-xs text-ink-mute dark:text-bone-mute">
        {t('moderation.attachments.empty')}
      </p>
    )
  }

  return (
    <ul className="flex flex-wrap gap-3 py-2">
      {attachments.map((attachment, index) => (
        <li
          key={attachment.id}
          className="flex flex-col gap-1.5 rounded-xl border border-line bg-canvas p-2 dark:border-night-line dark:bg-night"
        >
          <img
            src={attachment.dataUrl}
            alt={t('moderation.attachments.alt', {
              index: index + 1,
              username: attachment.uploader.username,
            })}
            className="h-20 w-20 rounded-lg object-cover"
          />
          <p className="max-w-20 truncate font-mono text-[0.62rem] text-ink-mute dark:text-bone-mute">
            @{attachment.uploader.username} · {formatKb(attachment.byteSize)}
          </p>
          <ConfirmActionButton
            label={t('moderation.attachments.remove')}
            confirmLabel={t('moderation.attachments.removeConfirm')}
            pending={deleteMut.isPending}
            onConfirm={() => deleteMut.mutateAsync(attachment.id).catch(() => undefined)}
            icon={<Trash2 aria-hidden="true" className="h-3 w-3" />}
          />
        </li>
      ))}
    </ul>
  )
}
