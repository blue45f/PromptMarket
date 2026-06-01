import { Bell, BellRing, CheckCircle2, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@utils/cn'

const READ_IDS_STORAGE_KEY = 'pm.notificationReadIds'
const notificationIds = ['wishlist-watchers', 'release-notes'] as const
const unreadIds = new Set<string>(notificationIds)

function unreadCount(readIds: Set<string>) {
  return notificationIds.filter((id) => !readIds.has(id)).length
}

function readIdsFromStorage() {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const parsed = JSON.parse(window.localStorage.getItem(READ_IDS_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return new Set<string>()
    return new Set(parsed.filter((id): id is string => unreadIds.has(id)))
  } catch {
    return new Set<string>()
  }
}

function persistReadIds(readIds: Set<string>) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify(Array.from(readIds)))
  } catch {
    // Local storage can be unavailable in private browsing or locked-down embeds.
  }
}

type Notification = {
  id: string
  title: string
  body: string
  action: string
  href: string
}

export default function NotificationBell() {
  const { t } = useTranslation('nav')
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => readIdsFromStorage())
  const wrapperRef = useRef<HTMLDivElement>(null)

  const notifications: Notification[] = [
    {
      id: 'wishlist-watchers',
      title: t('notifications.items.wishlist.title', {
        defaultValue: 'Wishlist watch is active',
      }),
      body: t('notifications.items.wishlist.body', {
        defaultValue: 'Saved listings are ready to revisit from your dashboard.',
      }),
      action: t('notifications.items.wishlist.action', { defaultValue: 'Open wishlist' }),
      href: '/dashboard?tab=wishlist',
    },
    {
      id: 'release-notes',
      title: t('notifications.items.release.title', { defaultValue: 'Product update available' }),
      body: t('notifications.items.release.body', {
        defaultValue: 'New marketplace polish is now live on listing previews.',
      }),
      action: t('notifications.items.release.action', { defaultValue: 'See what changed' }),
      href: '/browse?sort=newest',
    },
  ]

  const newCount = unreadCount(readIds)
  const triggerLabel =
    newCount > 0
      ? t('notifications.labelWithCount', {
          defaultValue: 'Notifications, {{count}} unread',
          count: newCount,
        })
      : t('notifications.labelNoUnread', { defaultValue: 'Notifications, none unread' })

  useEffect(() => {
    if (!open) return

    function onDocumentPointerDown(e: MouseEvent) {
      if (!wrapperRef.current || wrapperRef.current.contains(e.target as Node)) return
      setOpen(false)
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocumentPointerDown)
    document.addEventListener('keydown', onEscape)

    return () => {
      document.removeEventListener('mousedown', onDocumentPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  function markAllRead() {
    const next = new Set(unreadIds)
    persistReadIds(next)
    setReadIds(next)
  }

  function markReadOnce(id: string) {
    if (readIds.has(id)) return
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      persistReadIds(next)
      return next
    })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls="notification-bell-panel"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:bg-canvas-sub dark:hover:bg-night-sub motion-safe:transition ease-expo focus-volt active:scale-95"
      >
        {newCount ? (
          <BellRing className="w-4 h-4" aria-hidden />
        ) : (
          <Bell className="w-4 h-4" aria-hidden />
        )}
        {newCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full px-1 flex items-center justify-center text-[0.58rem] font-mono font-semibold bg-volt-500 text-ink shadow-[0_0_0_2px_var(--color-canvas)] dark:shadow-[0_0_0_2px_var(--color-night-sub)]"
          >
            {newCount > 9 ? '9+' : newCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-bell-panel"
          role="dialog"
          className="absolute right-0 top-full z-20 mt-2 w-[21rem] max-w-[90vw] rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night-sub shadow-2xl shadow-ink/15 dark:shadow-black/35 overflow-hidden"
          aria-label={t('notifications.panelTitle', { defaultValue: 'Notifications' })}
        >
          <div className="px-3.5 py-3 border-b border-line dark:border-night-line bg-canvas-sub dark:bg-night-deep">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-[0.92rem] text-ink dark:text-bone">
                  {t('notifications.panelTitle', { defaultValue: 'Notifications' })}
                </p>
                <p className="mt-0.5 text-[0.7rem] font-mono text-volt-700 dark:text-volt-300">
                  {newCount > 0
                    ? t('notifications.panelBody', {
                        defaultValue: '{{count}} new updates waiting',
                        count: newCount,
                      })
                    : t('notifications.empty', {
                        defaultValue: 'All clear. No new updates.',
                      })}
                </p>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={newCount === 0}
                className="shrink-0 inline-flex items-center gap-1.5 text-[0.66rem] font-mono tracking-[0.12em] uppercase text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone disabled:opacity-45 disabled:hover:text-ink-soft dark:disabled:hover:text-bone-soft motion-safe:transition ease-expo focus-volt rounded-md px-1.5 py-1"
                aria-label={t('notifications.markAllRead', { defaultValue: 'Mark all as read' })}
                onMouseDown={(e) => e.preventDefault()}
              >
                <CheckCircle2 className="w-3 h-3" aria-hidden />
                {t('notifications.markAllRead', { defaultValue: 'Mark all as read' })}
              </button>
            </div>
          </div>

          <ul className="max-h-64 overflow-auto py-1" role="list">
            {notifications.map((note) => {
              const read = readIds.has(note.id)
              return (
                <li key={note.id} className="px-1">
                  <Link
                    to={note.href}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      markReadOnce(note.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'block w-full text-left rounded-xl px-2.5 py-2.5 space-y-1 motion-safe:transition-colors ease-expo focus-volt',
                      read
                        ? 'bg-transparent text-ink-soft dark:text-bone-soft hover:bg-ink/5 dark:hover:bg-bone/10'
                        : 'bg-canvas-sub dark:bg-night-deep/80 hover:bg-volt-100 dark:hover:bg-volt-900/20'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          read ? 'bg-line dark:bg-night-line' : 'bg-volt-500 volt-pulse'
                        }`}
                      />
                      <div className="min-w-0">
                        <div
                          className={`text-[0.82rem] font-medium leading-tight ${
                            read ? 'text-ink-soft dark:text-bone-soft' : 'text-ink dark:text-bone'
                          }`}
                        >
                          {note.title}
                        </div>
                        <p className="mt-1 text-[0.7rem] text-ink-soft dark:text-bone-soft leading-relaxed">
                          {note.body}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3.5 flex min-w-0 items-center justify-end gap-1.5 text-[0.64rem] uppercase tracking-[0.12em] text-ink-soft dark:text-bone-soft">
                      <span className="shrink-0">
                        {read
                          ? t('notifications.read', { defaultValue: 'Read' })
                          : t('notifications.unread', { defaultValue: 'New' })}
                      </span>
                      <ChevronRight className="w-3 h-3" aria-hidden />
                      <span className="font-mono truncate">{note.action}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="px-3.5 py-2 border-t border-line dark:border-night-line text-[0.65rem] font-mono text-ink-soft dark:text-bone-soft">
            <p>
              {t('notifications.panelFooter', {
                defaultValue: 'Read state is saved on this browser.',
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
