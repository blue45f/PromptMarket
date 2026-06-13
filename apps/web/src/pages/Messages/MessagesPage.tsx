import EmptyState from '@components/EmptyState'
import { useMessageThreads } from '@domains/messages'
import { usePageMeta } from '@hooks/usePageMeta'
import { getErrorMessage } from '@infrastructure/api'
import { cn } from '@utils/cn'
import { formatRelative } from '@utils/format'
import { Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function MessagesPage() {
  const { t } = useTranslation('messages')
  const { data, isPending, error } = useMessageThreads()

  usePageMeta({ title: t('meta.title'), description: t('meta.description') })

  const threads = data ?? []

  return (
    <div className="mx-auto max-w-3xl px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="mb-7">
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.98] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('inbox.title')}
        </h1>
        <p className="mt-2 max-w-[56ch] text-ink-soft dark:text-bone-soft">{t('inbox.subtitle')}</p>
      </header>

      {error && (
        <p role="status" className="mb-6 font-mono text-sm text-coral-deep dark:text-coral">
          {getErrorMessage(error)}
        </p>
      )}

      {isPending ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse"
            />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <EmptyState
          emoji="✉️"
          variant="gated"
          title={t('inbox.emptyTitle')}
          description={t('inbox.emptyDescription')}
          hint={t('inbox.emptyHint')}
          action={
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone dark:bg-bone dark:text-ink motion-safe:transition ease-expo lift-on-hover focus-volt"
            >
              <Inbox aria-hidden="true" className="h-4 w-4" />
              {t('inbox.emptyCta')}
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line/70 rounded-2xl border border-line bg-canvas-sub dark:divide-night-line/70 dark:border-night-line dark:bg-night-sub">
          {threads.map((thread) => {
            const unread = thread.unreadCount > 0
            return (
              <li key={thread.id}>
                <Link
                  to={`/messages/${thread.id}`}
                  className="group flex items-center gap-4 px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl hover:bg-canvas-deep/60 dark:hover:bg-night-deep/60 motion-safe:transition ease-expo focus-volt"
                >
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-canvas-deep text-xl dark:bg-night-deep"
                  >
                    {thread.listing.coverEmoji || '✨'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={cn(
                          'truncate text-sm text-ink dark:text-bone',
                          unread ? 'font-bold' : 'font-semibold'
                        )}
                      >
                        @{thread.counterpart.username}
                        <span className="ml-2 font-normal text-ink-mute dark:text-bone-mute">
                          {t(thread.role === 'buyer' ? 'inbox.roleBuyer' : 'inbox.roleSeller')}
                        </span>
                      </p>
                      <span className="shrink-0 text-xs text-ink-mute dark:text-bone-mute">
                        {formatRelative(thread.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-soft dark:text-bone-soft">
                      {thread.listing.title}
                    </p>
                    {thread.lastMessage && (
                      <p
                        className={cn(
                          'mt-1 truncate text-sm',
                          unread
                            ? 'font-medium text-ink dark:text-bone'
                            : 'text-ink-mute dark:text-bone-mute'
                        )}
                      >
                        {thread.lastMessage.body}
                      </p>
                    )}
                  </div>
                  {unread && (
                    <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-volt-400 px-1.5 font-mono text-[0.7rem] font-bold tabular-nums text-ink">
                      <span className="sr-only">{t('inbox.unreadLabel')}</span>
                      {thread.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
