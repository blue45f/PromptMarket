/**
 * NotifyDeskBell — NATIVE NotifyDesk inbox bell (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * Reads the signed-in recipient's live NotifyDesk inbox via the PUBLISHED SDK
 * (`createNotifyClient`, `pk_` browser surface) and renders it with THIS APP'S
 * own design tokens — the same dropdown shell as the first-party bell, so it is
 * indistinguishable from a native part of the navbar. No widget bundle, no
 * foreign CSS, no `sk_` key.
 *
 * Mounting is decided by NavbarNotificationBell: this renders only when
 * VITE_NOTIFYDESK_URL is set AND a recipient (signed-in user.id) exists. Unset
 * env falls back to the first-party static bell — fully reversible.
 *
 * a11y: bell + unread badge · role="dialog" dropdown · outside-click + Esc to
 * close · focus-visible ring (focus-volt) · contrast ≥4.5:1 · prefers-reduced-
 * motion respected via motion-safe utilities.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { type NotifyClient, type NotifyNotification } from '@heejun/deskcloud'
import { cn } from '@utils/cn'
import { formatRelative } from '@utils/format'
import { Bell, BellRing, CheckCircle2, Loader2, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const POLL_INTERVAL_MS = 30_000
const INBOX_LIMIT = 20

type Phase = 'idle' | 'loading' | 'ready' | 'error'

interface NotifyDeskBellProps {
  /** NotifyDesk client (publishable). */
  client: NotifyClient
  /** Tenant-side recipient id (the signed-in user id). */
  recipientId: string
}

export default function NotifyDeskBell({ client, recipientId }: NotifyDeskBellProps) {
  const { t } = useTranslation('nav')
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [items, setItems] = useState<NotifyNotification[]>([])
  const [unread, setUnread] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Poll the unread count even while closed so the badge stays fresh.
  useEffect(() => {
    let cancelled = false
    const tick = () => {
      client
        .getUnreadCount({ recipientId })
        .then((r) => {
          if (!cancelled) setUnread(r.unreadCount)
        })
        .catch(() => {
          /* transient — recovered on the next tick */
        })
    }
    tick()
    const timer = setInterval(tick, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [client, recipientId])

  const loadInbox = useCallback(() => {
    setPhase('loading')
    client
      .getInbox({ recipientId, limit: INBOX_LIMIT })
      .then((inbox) => {
        setItems(inbox.items)
        setUnread(inbox.unreadCount)
        setPhase('ready')
      })
      .catch(() => setPhase('error'))
  }, [client, recipientId])

  const markAllRead = useCallback(() => {
    // Optimistic — reflect the read state immediately, reconcile on response.
    setItems((prev) => prev.map((it) => (it.status === 'read' ? it : { ...it, status: 'read' })))
    setUnread(0)
    client
      .markRead({ recipientId, all: true })
      .then((r) => setUnread(r.unreadCount))
      .catch(() => {
        /* next poll/reopen reconciles the true count */
      })
  }, [client, recipientId])

  const openPanel = useCallback(() => {
    setOpen(true)
    loadInbox()
    if (unread > 0) markAllRead()
  }, [loadInbox, markAllRead, unread])

  const closePanel = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  // Outside click + Esc close.
  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (!wrapperRef.current || wrapperRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closePanel])

  const triggerLabel = useMemo(
    () =>
      unread > 0
        ? t('notifications.labelWithCount', {
            defaultValue: 'Notifications, {{count}} unread',
            count: unread,
          })
        : t('notifications.labelNoUnread', { defaultValue: 'Notifications, none unread' }),
    [unread, t]
  )

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls="notifydesk-bell-panel"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:bg-canvas-sub dark:hover:bg-night-sub motion-safe:transition ease-expo focus-volt active:scale-95 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
      >
        {unread > 0 ? (
          <BellRing className="w-4 h-4" aria-hidden />
        ) : (
          <Bell className="w-4 h-4" aria-hidden />
        )}
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full px-1 flex items-center justify-center text-[0.58rem] font-mono font-semibold bg-volt-500 text-ink shadow-[0_0_0_2px_var(--color-canvas)] dark:shadow-[0_0_0_2px_var(--color-night-sub)]"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notifydesk-bell-panel"
          role="dialog"
          aria-modal="false"
          aria-label={t('notifications.panelTitle', { defaultValue: 'Notifications' })}
          className="absolute right-0 top-full z-20 mt-2 w-[21rem] max-w-[90vw] rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night-sub shadow-2xl shadow-ink/15 dark:shadow-black/35 overflow-hidden motion-safe:animate-fade-in"
        >
          <div className="px-3.5 py-3 border-b border-line dark:border-night-line bg-canvas-sub dark:bg-night-deep">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-[0.92rem] text-ink dark:text-bone">
                  {t('notifications.panelTitle', { defaultValue: 'Notifications' })}
                </p>
                <p className="mt-0.5 text-[0.7rem] font-mono text-volt-700 dark:text-volt-300">
                  {unread > 0
                    ? t('notifications.panelBody', {
                        defaultValue: '{{count}} new updates waiting',
                        count: unread,
                      })
                    : t('notifications.empty', { defaultValue: 'All clear. No new updates.' })}
                </p>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unread === 0}
                className="shrink-0 inline-flex items-center gap-1.5 text-[0.66rem] font-mono tracking-[0.12em] uppercase text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone disabled:opacity-45 disabled:hover:text-ink-soft dark:disabled:hover:text-bone-soft motion-safe:transition ease-expo focus-volt rounded-md px-1.5 py-1"
                aria-label={t('notifications.markAllRead', { defaultValue: 'Mark all as read' })}
                onMouseDown={(e) => e.preventDefault()}
              >
                <CheckCircle2 className="w-3 h-3" aria-hidden />
                {t('notifications.markAllRead', { defaultValue: 'Mark all as read' })}
              </button>
            </div>
          </div>

          {phase === 'loading' && items.length === 0 && (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-[0.78rem] text-ink-soft dark:text-bone-soft">
              <Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden />
              {t('notifications.loading', { defaultValue: 'Loading notifications…' })}
            </div>
          )}

          {phase === 'error' && (
            <div role="alert" className="px-4 py-10 text-center">
              <span
                aria-hidden
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-coral/12 text-coral-deep dark:text-coral"
              >
                <TriangleAlert className="w-5 h-5" />
              </span>
              <p className="text-[0.85rem] font-medium text-ink dark:text-bone">
                {t('notifications.errorTitle', { defaultValue: "Couldn't load notifications" })}
              </p>
              <button
                type="button"
                onClick={loadInbox}
                className="mt-3 inline-flex items-center rounded-full border border-line px-4 py-1.5 text-[0.78rem] font-medium text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
              >
                {t('notifications.retry', { defaultValue: 'Try again' })}
              </button>
            </div>
          )}

          {phase === 'ready' && items.length === 0 && (
            <div className="px-4 py-10 text-center">
              <span
                aria-hidden
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-canvas-sub text-ink-mute dark:bg-night-deep dark:text-bone-mute"
              >
                <Bell className="w-5 h-5" />
              </span>
              <p className="text-[0.85rem] font-medium text-ink dark:text-bone">
                {t('notifications.empty', { defaultValue: 'All clear. No new updates.' })}
              </p>
            </div>
          )}

          {items.length > 0 && (
            <ul className="max-h-64 overflow-auto py-1">
              {items.map((note) => {
                const isUnread = note.status !== 'read'
                return (
                  <li key={note.id} className="px-1">
                    <div
                      className={cn(
                        'block rounded-xl px-2.5 py-2.5 space-y-1',
                        isUnread
                          ? 'bg-canvas-sub dark:bg-night-deep/80'
                          : 'bg-transparent text-ink-soft dark:text-bone-soft'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          aria-hidden
                          className={cn(
                            'mt-0.5 w-1.5 h-1.5 rounded-full shrink-0',
                            isUnread ? 'bg-volt-500' : 'bg-line dark:bg-night-line'
                          )}
                        />
                        <div className="min-w-0">
                          {note.title && (
                            <div
                              className={cn(
                                'text-[0.82rem] font-medium leading-tight',
                                isUnread
                                  ? 'text-ink dark:text-bone'
                                  : 'text-ink-soft dark:text-bone-soft'
                              )}
                            >
                              {note.title}
                            </div>
                          )}
                          {note.body && (
                            <p className="mt-1 text-[0.7rem] text-ink-soft dark:text-bone-soft leading-relaxed">
                              {note.body}
                            </p>
                          )}
                          <p className="mt-1.5 flex items-center gap-1.5 text-[0.64rem] uppercase tracking-[0.12em] text-ink-mute dark:text-bone-mute">
                            <time dateTime={note.createdAt}>{formatRelative(note.createdAt)}</time>
                            {isUnread && (
                              <span className="font-mono normal-case text-volt-700 dark:text-volt-300">
                                {t('notifications.unread', { defaultValue: 'New' })}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="px-3.5 py-2 border-t border-line dark:border-night-line text-[0.65rem] font-mono text-ink-soft dark:text-bone-soft">
            <p>
              {t('notifications.liveFooter', { defaultValue: 'Live from your account inbox.' })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
