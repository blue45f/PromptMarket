import { Textarea } from '@components/ui'
import { useMessageThread, useSendMessage, THREAD_POLL_MS } from '@domains/messages'
import { usePageMeta } from '@hooks/usePageMeta'
import { getErrorMessage } from '@infrastructure/api'
import { MESSAGE_BODY_MAX } from '@promptmarket/shared'
import { useAuthStore } from '@store/auth'
import { cn } from '@utils/cn'
import { formatDate, formatRelative } from '@utils/format'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('messages')
  const { user } = useAuthStore()
  const { data: thread, isPending, error } = useMessageThread(id)
  const sendMut = useSendMessage(id)

  const [draft, setDraft] = useState('')
  const listEndRef = useRef<HTMLDivElement | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  usePageMeta({
    title: thread
      ? t('meta.threadTitle', { username: thread.counterpart.username })
      : t('meta.title'),
  })

  // Stick to the bottom when a new message arrives (initial load included).
  useEffect(() => {
    const lastId = thread?.messages[thread.messages.length - 1]?.id ?? null
    if (lastId && lastId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastId
      listEndRef.current?.scrollIntoView({ block: 'end' })
    }
  }, [thread?.messages])

  async function handleSend() {
    const body = draft.trim()
    if (!body || sendMut.isPending) return
    try {
      await sendMut.mutateAsync(body)
      setDraft('')
    } catch {
      /* toast handled in hook */
    }
  }

  if (isPending) {
    return (
      <div
        className="mx-auto max-w-3xl px-[clamp(1.25rem,4vw,3rem)] py-12 space-y-4"
        aria-busy="true"
      >
        <div className="h-16 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
        <div className="h-72 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="mx-auto max-w-3xl px-[clamp(1.25rem,4vw,3rem)] py-16 text-center">
        <p className="text-coral-deep dark:text-coral">
          {error ? getErrorMessage(error) : t('thread.notFound')}
        </p>
        <Link
          to="/messages"
          className="mt-4 inline-block text-volt-700 underline dark:text-volt-300 focus-volt"
        >
          {t('thread.backToInbox')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-[clamp(1.25rem,4vw,3rem)] py-[clamp(1.5rem,3vw,2.5rem)] animate-fade-in">
      <Link
        to="/messages"
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-soft hover:text-ink dark:text-bone-soft dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('thread.backToInbox')}
      </Link>

      {/* Listing context — the conversation is always about one listing. */}
      <Link
        to={`/listings/${thread.listing.slug}`}
        className="group mt-4 flex items-center gap-3 rounded-2xl border border-line bg-canvas-sub px-4 py-3 hover:border-volt-400 dark:border-night-line dark:bg-night-sub dark:hover:border-volt-500/60 motion-safe:transition ease-expo focus-volt"
      >
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas-deep text-lg dark:bg-night-deep"
        >
          {thread.listing.coverEmoji || '✨'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink dark:text-bone">
            {thread.listing.title}
          </p>
          <p className="text-xs text-ink-mute dark:text-bone-mute">
            {t('thread.withUser', { username: thread.counterpart.username })} ·{' '}
            {t(thread.role === 'buyer' ? 'thread.roleBuyer' : 'thread.roleSeller')}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-volt-700 dark:text-volt-300">
          {t('thread.viewListing')}
        </span>
      </Link>

      <section
        aria-label={t('thread.logLabel')}
        className="mt-4 flex-1 space-y-3 rounded-2xl border border-line bg-canvas-sub p-4 dark:border-night-line dark:bg-night-sub sm:p-5"
      >
        {thread.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-mute dark:text-bone-mute">
            {t('thread.empty')}
          </p>
        ) : (
          <ol className="space-y-3">
            {thread.messages.map((message) => {
              const mine = message.senderId === user?.id
              return (
                <li key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3.5 py-2.5',
                      mine
                        ? 'rounded-br-md bg-ink text-bone dark:bg-bone dark:text-ink'
                        : 'rounded-bl-md bg-canvas text-ink ring-1 ring-line dark:bg-night dark:text-bone dark:ring-night-line'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.body}
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-[0.64rem] tabular-nums',
                        mine ? 'opacity-70' : 'text-ink-mute dark:text-bone-mute'
                      )}
                      title={formatDate(message.createdAt)}
                    >
                      {formatRelative(message.createdAt)}
                      {mine && message.readAt ? ` · ${t('thread.read')}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        <div ref={listEndRef} aria-hidden />
        <p className="border-t border-line/60 pt-3 text-center text-[0.66rem] text-ink-mute dark:border-night-line/60 dark:text-bone-mute">
          {t('thread.pollingNote', { seconds: Math.round(THREAD_POLL_MS / 1000) })}
        </p>
      </section>

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSend()
        }}
        noValidate
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              void handleSend()
            }
          }}
          maxLength={MESSAGE_BODY_MAX}
          rows={2}
          aria-label={t('thread.composerLabel')}
          placeholder={t('thread.composerPlaceholder')}
          className="min-h-[3.25rem] flex-1"
        />
        <button
          type="submit"
          disabled={sendMut.isPending || draft.trim().length === 0}
          aria-label={t('thread.send')}
          className="inline-flex h-[3.25rem] shrink-0 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-bone disabled:cursor-not-allowed disabled:opacity-60 dark:bg-bone dark:text-ink motion-safe:transition ease-expo focus-volt"
        >
          {sendMut.isPending ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
          ) : (
            <Send aria-hidden="true" className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{t('thread.send')}</span>
        </button>
      </form>
    </div>
  )
}
