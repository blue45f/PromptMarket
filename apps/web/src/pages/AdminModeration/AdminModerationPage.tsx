import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ImageIcon, Trash2 } from 'lucide-react'
import { useAdminDeleteThread, useAdminThreads, useSetThreadVisibility } from '@features/admin'
import { usePageMeta } from '@hooks/usePageMeta'
import AdminNav from '@components/AdminNav'
import AdminAttachmentsPanel from '@components/AdminAttachmentsPanel'
import ConfirmActionButton from '@components/ConfirmActionButton'
import EmptyState from '@components/EmptyState'
import { getErrorMessage } from '@services/api'
import { formatDate } from '@utils/format'
import { cn } from '@utils/cn'

/** Community board moderation: hide, restore, delete, strip attachments. */
export default function AdminModerationPage() {
  const { t } = useTranslation('admin')
  const threadsQ = useAdminThreads()
  const visibilityMut = useSetThreadVisibility()
  const deleteMut = useAdminDeleteThread()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  usePageMeta({ title: t('moderation.meta.title'), description: t('moderation.meta.description') })

  const threads = threadsQ.data ?? []

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] pb-20 animate-fade-in">
      <header className="mb-6 space-y-2">
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('moderation.title')}
        </h1>
        <p className="max-w-[58ch] text-ink-soft dark:text-bone-soft">{t('moderation.subtitle')}</p>
      </header>

      <AdminNav />

      {threadsQ.error && (
        <p role="status" className="mb-6 font-mono text-sm text-coral-deep dark:text-coral">
          {getErrorMessage(threadsQ.error)}
        </p>
      )}

      {threadsQ.isPending ? (
        <div className="h-64 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
      ) : threads.length === 0 ? (
        <EmptyState
          emoji="🧹"
          title={t('moderation.emptyTitle')}
          description={t('moderation.emptyDescription')}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line dark:border-night-line">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas dark:bg-night">
                <tr className="text-left text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                  <th className="px-4 py-3 font-normal">{t('moderation.table.thread')}</th>
                  <th className="px-4 py-3 font-normal">{t('moderation.table.author')}</th>
                  <th className="px-4 py-3 font-normal">{t('moderation.table.activity')}</th>
                  <th className="px-4 py-3 font-normal">{t('moderation.table.status')}</th>
                  <th className="px-4 py-3 font-normal">{t('moderation.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-canvas-sub dark:bg-night-sub">
                {threads.map((thread) => {
                  const hidden = !!thread.hiddenAt
                  const expanded = expandedId === thread.id
                  return (
                    <ThreadRowGroup key={thread.id} expanded={expanded}>
                      <tr
                        className={cn(
                          'border-t border-line dark:border-night-line text-ink dark:text-bone',
                          hidden && 'opacity-70'
                        )}
                      >
                        <td className="max-w-[22rem] px-4 py-3">
                          <Link
                            to={`/community/${thread.id}`}
                            className="block truncate font-medium text-volt-700 hover:underline dark:text-volt-300 focus-volt"
                          >
                            {thread.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-mute dark:text-bone-mute">
                            {t(`home:categories.labels.${thread.category}`, {
                              defaultValue: thread.category,
                            })}{' '}
                            · {formatDate(thread.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">@{thread.author.username}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {t('moderation.table.activityValue', {
                            comments: thread.commentCount,
                            attachments: thread.attachmentCount,
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold',
                              hidden
                                ? 'bg-coral/15 text-coral-deep dark:text-coral'
                                : 'bg-volt-100 text-volt-900 dark:bg-volt-900/40 dark:text-volt-200'
                            )}
                          >
                            {hidden
                              ? t('moderation.status.hidden')
                              : t('moderation.status.visible')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                visibilityMut.mutate({ id: thread.id, hidden: !hidden })
                              }
                              disabled={visibilityMut.isPending}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                            >
                              {hidden ? (
                                <Eye aria-hidden="true" className="h-3 w-3" />
                              ) : (
                                <EyeOff aria-hidden="true" className="h-3 w-3" />
                              )}
                              {hidden ? t('moderation.actions.show') : t('moderation.actions.hide')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : thread.id)}
                              disabled={thread.attachmentCount === 0}
                              aria-expanded={expanded}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                            >
                              <ImageIcon aria-hidden="true" className="h-3 w-3" />
                              {t('moderation.actions.attachments', {
                                count: thread.attachmentCount,
                              })}
                            </button>
                            <ConfirmActionButton
                              label={t('moderation.actions.delete')}
                              confirmLabel={t('moderation.actions.deleteConfirm')}
                              pending={deleteMut.isPending}
                              onConfirm={() =>
                                deleteMut.mutateAsync(thread.id).catch(() => undefined)
                              }
                              icon={<Trash2 aria-hidden="true" className="h-3 w-3" />}
                            />
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-t border-line/60 dark:border-night-line/60">
                          <td colSpan={5} className="bg-canvas px-4 dark:bg-night">
                            <AdminAttachmentsPanel target={{ threadId: thread.id }} />
                          </td>
                        </tr>
                      )}
                    </ThreadRowGroup>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/** Fragment helper — keeps the expandable row adjacent to its parent row. */
function ThreadRowGroup({ children }: { expanded: boolean; children: React.ReactNode }) {
  return <>{children}</>
}
