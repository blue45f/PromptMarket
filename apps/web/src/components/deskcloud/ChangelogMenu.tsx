/**
 * ChangelogMenu — NATIVE ChangelogDesk "What's new" (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * A navbar icon button + dropdown that lists the published changelog wall via
 * the PUBLISHED SDK (`createChangelogClient`, `pk_`). Rendered only when
 * VITE_CHANGELOGDESK_URL is set (decided by the caller). Tracks unread against
 * an anonymous per-browser id (markSeen) and styles everything with the app's
 * own OKLCH tokens — it sits in the icon cluster exactly like the bell.
 *
 * a11y: trigger + unread badge · role="dialog" dropdown · outside-click + Esc ·
 * focus-volt ring · server-sanitized bodyHtml only · prefers-reduced-motion via
 * motion-safe utilities.
 * ──────────────────────────────────────────────────────────────────────────
 */
import MarkdownView from '@components/MarkdownView'
import { type ChangelogClient, type ChangelogEntry } from '@heejun/deskcloud'
import { cn } from '@utils/cn'
import { formatRelative } from '@utils/format'
import { Loader2, Sparkles, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getAnonId } from './config'

const WALL_LIMIT = 12

type Phase = 'idle' | 'loading' | 'ready' | 'error'

const TAG_TONE: Record<ChangelogEntry['tag'], string> = {
  new: 'bg-volt-100 text-volt-800 dark:bg-volt-900/50 dark:text-volt-200',
  improved: 'bg-iris/15 text-iris-deep dark:bg-iris/20 dark:text-iris',
  fixed: 'bg-canvas-deep text-ink-soft dark:bg-night-deep dark:text-bone-soft',
  announcement: 'bg-violet-soft text-violet-deep dark:bg-violet/20 dark:text-violet-soft',
}

interface ChangelogMenuProps {
  client: ChangelogClient
}

export default function ChangelogMenu({ client }: ChangelogMenuProps) {
  const { t } = useTranslation('nav')
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [items, setItems] = useState<ChangelogEntry[]>([])
  const [unread, setUnread] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const anonId = useMemo(() => getAnonId(), [])

  // Unread badge — poll lightly so "What's new" surfaces fresh releases.
  useEffect(() => {
    let cancelled = false
    const tick = () => {
      client
        .getUnreadCount({ anonId })
        .then((r) => {
          if (!cancelled) setUnread(r.unreadCount)
        })
        .catch(() => {
          /* transient */
        })
    }
    tick()
    const timer = setInterval(tick, 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [client, anonId])

  const loadWall = useCallback(() => {
    setPhase('loading')
    client
      .getWall({ limit: WALL_LIMIT })
      .then((wall) => {
        setItems(wall.items)
        setPhase('ready')
      })
      .catch(() => setPhase('error'))
  }, [client])

  const openMenu = useCallback(() => {
    setOpen(true)
    loadWall()
    // Opening the wall counts as "seen" — clear the badge optimistically.
    setUnread(0)
    client.markSeen({ anonId }).catch(() => {
      /* reconciled on the next poll */
    })
  }, [loadWall, client, anonId])

  const closeMenu = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (!wrapperRef.current || wrapperRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeMenu])

  const label =
    unread > 0
      ? t('changelog.labelWithCount', {
          defaultValue: "What's new, {{count}} unread",
          count: unread,
        })
      : t('changelog.label', { defaultValue: "What's new" })

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-label={label}
        aria-expanded={open}
        aria-controls="changelogdesk-panel"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:bg-canvas-sub dark:hover:bg-night-sub motion-safe:transition ease-expo focus-volt active:scale-95 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
      >
        <Sparkles className="w-4 h-4" aria-hidden />
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
          id="changelogdesk-panel"
          role="dialog"
          aria-modal="false"
          aria-label={t('changelog.title', { defaultValue: "What's new" })}
          className="absolute right-0 top-full z-20 mt-2 w-[23rem] max-w-[92vw] rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night-sub shadow-2xl shadow-ink/15 dark:shadow-black/35 overflow-hidden motion-safe:animate-fade-in"
        >
          <div className="px-4 py-3 border-b border-line dark:border-night-line bg-canvas-sub dark:bg-night-deep">
            <p className="font-display font-bold text-[0.98rem] tracking-tight text-ink dark:text-bone">
              {t('changelog.title', { defaultValue: "What's new" })}
            </p>
            <p className="mt-0.5 text-[0.7rem] font-mono text-volt-700 dark:text-volt-300">
              {t('changelog.subtitle', { defaultValue: 'Latest product updates' })}
            </p>
          </div>

          {phase === 'loading' && items.length === 0 && (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-[0.78rem] text-ink-soft dark:text-bone-soft">
              <Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden />
              {t('changelog.loading', { defaultValue: 'Loading updates…' })}
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
                {t('changelog.errorTitle', { defaultValue: "Couldn't load updates" })}
              </p>
              <button
                type="button"
                onClick={loadWall}
                className="mt-3 inline-flex items-center rounded-full border border-line px-4 py-1.5 text-[0.78rem] font-medium text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
              >
                {t('changelog.retry', { defaultValue: 'Try again' })}
              </button>
            </div>
          )}

          {phase === 'ready' && items.length === 0 && (
            <div className="px-4 py-10 text-center">
              <span
                aria-hidden
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-canvas-sub text-ink-mute dark:bg-night-deep dark:text-bone-mute"
              >
                <Sparkles className="w-5 h-5" />
              </span>
              <p className="text-[0.85rem] font-medium text-ink dark:text-bone">
                {t('changelog.empty', { defaultValue: 'Nothing new just yet.' })}
              </p>
            </div>
          )}

          {items.length > 0 && (
            <ul className="max-h-[22rem] overflow-auto divide-y divide-line dark:divide-night-line">
              {items.map((entry) => (
                <li key={entry.id} className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.62rem] font-mono font-semibold uppercase tracking-[0.08em]',
                        TAG_TONE[entry.tag]
                      )}
                    >
                      {t(`changelog.tags.${entry.tag}`, { defaultValue: entry.tag })}
                    </span>
                    {entry.version && (
                      <span className="font-mono text-[0.66rem] text-ink-mute dark:text-bone-mute">
                        {entry.version}
                      </span>
                    )}
                    {entry.publishedAt && (
                      <time
                        dateTime={entry.publishedAt}
                        className="ml-auto font-mono text-[0.64rem] uppercase tracking-[0.1em] text-ink-mute dark:text-bone-mute"
                      >
                        {formatRelative(entry.publishedAt)}
                      </time>
                    )}
                  </div>
                  <h3 className="mt-2 text-[0.9rem] font-semibold leading-snug text-ink dark:text-bone text-pretty">
                    {entry.title}
                  </h3>
                  {/* Render the markdown source through the app's own MarkdownView
                      (react-markdown, skipHtml) — native, sanitized, no raw HTML. */}
                  <MarkdownView
                    source={entry.bodyMarkdown}
                    className="mt-1 prose-xs text-[0.8rem]"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
