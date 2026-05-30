import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Compass, PlusCircle, Search, Sparkles, User } from 'lucide-react'
import { LISTING_TYPE_META } from '@promptmarket/shared'
import { useQueries, useQuery } from '@tanstack/react-query'
import { listingsKey, listingKey } from '@features/marketplace/queryKeys'
import { api } from '@services/api'
import { useDebounce } from '@hooks/useDebounce'
import { useWishlist } from '@hooks/useWishlist'
import { useSearchHistory } from '@hooks/useSearchHistory'
import type { ListingDetailResponse, ListingsListResponse } from '@/types'
import { Heart } from 'lucide-react'
import { formatPrice } from '@utils/format'
import { useAuthStore } from '@store/auth'
import { cn } from '@utils/cn'

/* ---------------------------------------------------------------------------
 * Command Palette — global ⌘K / Ctrl+K / "/" launcher. Opens a fluid search
 * dialog with arrow-key navigation, jumps to a listing or a quick action.
 *
 * Inspired by the Linear / Raycast / Vercel patterns: a single editor focused
 * on speed, no chrome. Results stream from the existing /listings API so the
 * palette stays in sync with the catalog at all times.
 * ------------------------------------------------------------------------- */

interface QuickAction {
  id: string
  labelKey: string
  hint: string
  to: string
  icon: typeof Compass
  requiresAuth?: boolean
}

const STATIC_ACTIONS: QuickAction[] = [
  {
    id: 'browse',
    labelKey: 'palette.actions.browse',
    hint: '/browse',
    to: '/browse',
    icon: Compass,
  },
  {
    id: 'browse-trending',
    labelKey: 'palette.actions.trending',
    hint: '/browse?sort=trending',
    to: '/browse?sort=trending',
    icon: Sparkles,
  },
  {
    id: 'browse-newest',
    labelKey: 'palette.actions.newest',
    hint: '/browse?sort=newest',
    to: '/browse?sort=newest',
    icon: Sparkles,
  },
  {
    id: 'browse-free',
    labelKey: 'palette.actions.free',
    hint: '/browse?free=true',
    to: '/browse?free=true',
    icon: Sparkles,
  },
  {
    id: 'sell',
    labelKey: 'palette.actions.sell',
    hint: '/sell',
    to: '/sell',
    icon: PlusCircle,
    requiresAuth: true,
  },
  {
    id: 'dashboard',
    labelKey: 'palette.actions.dashboard',
    hint: '/dashboard',
    to: '/dashboard',
    icon: User,
    requiresAuth: true,
  },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const { t } = useTranslation('errors')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const submittedRef = useRef(false)
  const token = useAuthStore((s) => s.token)

  // Global shortcut: ⌘K / Ctrl+K / "/"
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      const isSlash =
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target instanceof HTMLElement && e.target.isContentEditable)
        )
      if (isModK || isSlash) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      // Focus the input on the next tick after Radix mounts it
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const trimmed = q.trim()
  const debouncedQ = useDebounce(trimmed, 200)
  const listingsParams = debouncedQ ? { q: debouncedQ, pageSize: 8 } : { sort: 'top', pageSize: 6 }
  const listingsQ = useQuery({
    queryKey: listingsKey(listingsParams),
    queryFn: () =>
      api.get<ListingsListResponse, ListingsListResponse>('/listings', {
        params: {
          sort: listingsParams.sort || undefined,
          q: listingsParams.q || undefined,
          pageSize: listingsParams.pageSize,
        },
      }),
    enabled: open,
  })
  const listings = listingsQ.data?.items ?? []

  // Wishlist surfacing — hydrate up to 5 saved slugs so visitors can jump
  // from the palette into a previously saved listing.
  const { slugs: wishlistSlugs } = useWishlist()
  const history = useSearchHistory()
  const showHistory = !trimmed && history.entries.length > 0
  const visibleWishlist = wishlistSlugs.slice(0, 5)
  const wishlistResults = useQueries({
    queries: debouncedQ
      ? []
      : visibleWishlist.map((slug) => ({
          queryKey: listingKey(slug),
          queryFn: () => api.get<ListingDetailResponse, ListingDetailResponse>(`/listings/${slug}`),
          staleTime: 10 * 60_000,
          enabled: open,
        })),
  })
  const wishlistListings = wishlistResults
    .map((r) => r.data)
    .filter((l): l is NonNullable<typeof l> => !!l)

  const actions = useMemo(() => {
    const filtered = STATIC_ACTIONS.filter((a) => {
      if (a.requiresAuth && !token) return false
      if (!trimmed) return true
      return (t(a.labelKey) + ' ' + a.hint).toLowerCase().includes(trimmed.toLowerCase())
    })
    return filtered
  }, [trimmed, token, t])

  // Flat-index navigation across all sections.
  const total = actions.length + wishlistListings.length + listings.length

  useEffect(() => {
    if (active >= total) setActive(Math.max(0, total - 1))
  }, [total, active])

  // Keep the selected row in view
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const go = useCallback(
    (to: string) => {
      submittedRef.current = true
      setOpen(false)
      navigate(to)
    },
    [navigate]
  )

  function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % Math.max(1, total))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + Math.max(1, total)) % Math.max(1, total))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active < actions.length) {
        const a = actions[active]
        if (a) go(a.to)
      } else if (active < actions.length + wishlistListings.length) {
        const w = wishlistListings[active - actions.length]
        if (w) go(`/listings/${w.slug}`)
      } else {
        const l = listings[active - actions.length - wishlistListings.length]
        if (l) go(`/listings/${l.slug}`)
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in data-[state=closed]:motion-safe:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-[14vh] -translate-x-1/2 z-50 w-[min(640px,calc(100vw-2rem))]',
            'rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night shadow-2xl shadow-ink/40',
            'data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2',
            'data-[state=closed]:motion-safe:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95'
          )}
        >
          <Dialog.Title className="sr-only">{t('palette.srTitle')}</Dialog.Title>
          <Dialog.Description className="sr-only">{t('palette.srDescription')}</Dialog.Description>

          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line dark:border-night-line">
            <Search className="w-4 h-4 text-ink-mute dark:text-bone-mute shrink-0" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActive(0)
              }}
              onBlur={() => {
                if (submittedRef.current) {
                  history.record(trimmed)
                }
                submittedRef.current = false
              }}
              onKeyDown={handleInputKey}
              placeholder={t('palette.placeholder')}
              className="flex-1 bg-transparent outline-none placeholder:text-ink-mute dark:placeholder:text-bone-mute text-ink dark:text-bone"
              aria-label={t('palette.inputLabel')}
              role="combobox"
              aria-expanded={total > 0}
              aria-controls="palette-listbox"
              aria-autocomplete="list"
              aria-activedescendant={total > 0 ? `palette-row-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex font-mono text-[0.65rem] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border border-line dark:border-night-line text-ink-mute dark:text-bone-mute">
              esc
            </kbd>
          </div>

          <div
            ref={listRef}
            id="palette-listbox"
            role="listbox"
            aria-label={t('palette.srTitle')}
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {actions.length > 0 && (
              <Section
                label={trimmed ? t('palette.groups.actions') : t('palette.groups.quickActions')}
              >
                {actions.map((a, i) => (
                  <Row
                    key={a.id}
                    active={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(a.to)}
                    icon={<a.icon className="w-4 h-4" aria-hidden />}
                    title={t(a.labelKey)}
                    subtitle={a.hint}
                    rowIndex={i}
                  />
                ))}
              </Section>
            )}

            {showHistory && (
              <div className="px-1.5 py-1.5">
                <div className="flex items-center justify-between gap-3 px-2 pb-1.5 pt-1">
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                    {t('palette.recentSearches')}
                  </p>
                  <button
                    type="button"
                    onClick={() => history.clear()}
                    aria-label={t('history.clearAll', { defaultValue: '검색 기록 전체 삭제' })}
                    className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral motion-safe:transition focus-volt rounded"
                  >
                    {t('palette.clear')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {history.entries.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setQ(h)
                        setActive(0)
                        inputRef.current?.focus()
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-sub dark:bg-night-sub border border-line dark:border-night-line text-[0.74rem] text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:border-volt-400 dark:hover:border-volt-500/60 motion-safe:transition focus-volt"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!trimmed && wishlistListings.length > 0 && (
              <Section label={t('palette.groups.wishlist')}>
                {wishlistListings.map((l, i) => {
                  const meta = LISTING_TYPE_META[l.type]
                  const rowIdx = actions.length + i
                  return (
                    <Row
                      key={l.id}
                      active={rowIdx === active}
                      onMouseEnter={() => setActive(rowIdx)}
                      onClick={() => go(`/listings/${l.slug}`)}
                      icon={<Heart className="w-3.5 h-3.5 fill-current text-coral" aria-hidden />}
                      title={l.title}
                      subtitle={`${t('common:types.' + l.type, { defaultValue: meta?.label ?? l.type }).toLowerCase()} · @${l.author?.username ?? t('palette.unknownAuthor')}`}
                      rowIndex={rowIdx}
                    />
                  )
                })}
              </Section>
            )}

            {(listings.length > 0 || listingsQ.isPending) && (
              <Section
                label={trimmed ? t('palette.groups.listings') : t('palette.groups.topListings')}
              >
                {listingsQ.isPending && (
                  <div className="px-3 py-6 text-sm text-ink-mute dark:text-bone-mute">
                    {t('palette.loading')}
                  </div>
                )}
                {listings.map((l, i) => {
                  const meta = LISTING_TYPE_META[l.type]
                  const rowIdx = actions.length + wishlistListings.length + i
                  return (
                    <Row
                      key={l.id}
                      active={rowIdx === active}
                      onMouseEnter={() => setActive(rowIdx)}
                      onClick={() => go(`/listings/${l.slug}`)}
                      icon={
                        <span
                          aria-hidden
                          className="inline-flex w-6 h-6 items-center justify-center rounded-md text-base"
                        >
                          {l.coverEmoji || meta.emoji}
                        </span>
                      }
                      title={l.title}
                      subtitle={`${t('common:types.' + l.type, { defaultValue: meta?.label ?? l.type }).toLowerCase()} · @${l.author?.username ?? t('palette.unknownAuthor')}`}
                      trailing={
                        <span
                          className={cn(
                            'shrink-0 inline-flex items-center font-mono text-[0.66rem] px-1.5 py-0.5 rounded-md',
                            (l.priceCents ?? 0) === 0
                              ? 'bg-volt-300 text-ink'
                              : 'bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft border border-line dark:border-night-line'
                          )}
                        >
                          {formatPrice(l.priceCents ?? 0)}
                        </span>
                      }
                      rowIndex={rowIdx}
                    />
                  )
                })}
              </Section>
            )}

            {!listingsQ.isPending && total === 0 && (
              <div className="px-4 py-10 text-center text-sm text-ink-mute dark:text-bone-mute">
                <p className="font-display text-[1.15rem] text-ink dark:text-bone mb-1">
                  {t('palette.emptyTitle')}
                </p>
                <p>{t('palette.emptyBody')}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-line dark:border-night-line text-[0.66rem] font-mono uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute">
            <div className="flex items-center gap-3">
              <Hint k="↑↓" label={t('palette.hints.navigate')} />
              <Hint k="↵" label={t('palette.hints.select')} />
              <Hint k="/" label={t('palette.hints.open')} />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" aria-hidden /> PromptMarket
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-1.5 py-1.5">
      <p className="px-2 pb-1.5 pt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
        {label}
      </p>
      <div role="group" aria-label={label} className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  )
}

function Row({
  active,
  onClick,
  onMouseEnter,
  icon,
  title,
  subtitle,
  trailing,
  rowIndex,
}: {
  active: boolean
  onClick: () => void
  onMouseEnter: () => void
  icon: React.ReactNode
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  rowIndex: number
}) {
  return (
    <div
      role="option"
      id={`palette-row-${rowIndex}`}
      aria-selected={active}
      data-row={rowIndex}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left motion-safe:transition-colors cursor-default',
        active
          ? 'bg-volt-100 dark:bg-volt-900/40 text-ink dark:text-bone'
          : 'text-ink-soft dark:text-bone-soft hover:bg-canvas-sub dark:hover:bg-night-sub'
      )}
    >
      <span
        className={cn(
          'shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg border',
          active
            ? 'bg-volt-300 text-ink border-volt-400/70'
            : 'bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft border-line dark:border-night-line'
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink dark:text-bone truncate">{title}</span>
        {subtitle && (
          <span className="block text-[0.72rem] font-mono text-ink-mute dark:text-bone-mute truncate">
            {subtitle}
          </span>
        )}
      </span>
      {trailing}
      <ArrowRight
        className={cn(
          'w-3.5 h-3.5 shrink-0 text-ink-mute dark:text-bone-mute motion-safe:transition',
          active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
        )}
        aria-hidden
      />
    </div>
  )
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="inline-flex font-mono text-[0.62rem] uppercase px-1 py-0.5 rounded border border-line dark:border-night-line text-ink-soft dark:text-bone-soft">
        {k}
      </kbd>
      {label}
    </span>
  )
}
