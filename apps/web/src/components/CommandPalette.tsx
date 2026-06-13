import { listingsKey, listingKey } from '@features/marketplace/queryKeys'
import { useDebounce } from '@hooks/useDebounce'
import { useSavedFilters } from '@hooks/useSavedFilters'
import { useSearchHistory } from '@hooks/useSearchHistory'
import { useWishlist } from '@hooks/useWishlist'
import { LISTING_TYPE_META } from '@promptmarket/shared'
import * as Dialog from '@radix-ui/react-dialog'
import { api } from '@services/api'
import { useAuthStore } from '@store/auth'
import { useQueries, useQuery } from '@tanstack/react-query'
import { cn } from '@utils/cn'
import { formatPrice } from '@utils/format'
import {
  ArrowRight,
  Compass,
  Filter,
  Heart,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ListingDetailResponse, ListingsListResponse } from '@/types'

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
  requiresAdmin?: boolean
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
  {
    id: 'admin',
    labelKey: 'palette.actions.admin',
    hint: '/admin',
    to: '/admin',
    icon: ShieldCheck,
    requiresAuth: true,
    requiresAdmin: true,
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
  const user = useAuthStore((s) => s.user)

  const resetPaletteState = useCallback(() => {
    submittedRef.current = false
    setQ('')
    setActive(0)
  }, [])

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
        if (open) {
          setOpen(false)
        } else {
          resetPaletteState()
          setOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, resetPaletteState])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) resetPaletteState()
      setOpen(nextOpen)
    },
    [resetPaletteState]
  )

  // Focus the search box after the opening animation starts.
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  const trimmed = q.trim()
  const debouncedQ = useDebounce(trimmed, 200)
  const listingsParams = useMemo(
    () => (debouncedQ ? { q: debouncedQ, pageSize: 8 } : { sort: 'top', pageSize: 6 }),
    [debouncedQ]
  )
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
  const listings = useMemo(() => listingsQ.data?.items ?? [], [listingsQ.data?.items])

  // Wishlist surfacing — hydrate up to 5 saved slugs so visitors can jump
  // from the palette into a previously saved listing.
  const { slugs: wishlistSlugs } = useWishlist()
  const { entries: savedFilterEntries } = useSavedFilters()
  const history = useSearchHistory()
  const showHistory = !trimmed && history.entries.length > 0
  const visibleWishlist = useMemo(() => wishlistSlugs.slice(0, 5), [wishlistSlugs])
  const visibleSavedFilters = useMemo(
    () => (trimmed ? [] : savedFilterEntries),
    [trimmed, savedFilterEntries]
  )
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
  const wishlistListings = useMemo(
    () => wishlistResults.map((r) => r.data).filter((l): l is NonNullable<typeof l> => !!l),
    [wishlistResults]
  )

  const actions = useMemo(() => {
    const filtered = STATIC_ACTIONS.filter((a) => {
      if (a.requiresAuth && !token) return false
      if (a.requiresAdmin && !user?.isAdmin) return false
      if (!trimmed) return true
      return (t(a.labelKey) + ' ' + a.hint).toLowerCase().includes(trimmed.toLowerCase())
    })
    return filtered
  }, [trimmed, token, user?.isAdmin, t])

  // Flat-index navigation across all sections.
  const total =
    actions.length + wishlistListings.length + visibleSavedFilters.length + listings.length
  const activeIndex = total > 0 ? Math.min(active, total - 1) : 0

  // Keep the selected row in view
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const go = useCallback(
    (to: string) => {
      submittedRef.current = true
      setOpen(false)
      navigate(to)
    },
    [navigate]
  )

  const handleInputKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => (i + 1) % Math.max(1, total))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i - 1 + Math.max(1, total)) % Math.max(1, total))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex < actions.length) {
          const a = actions[activeIndex]
          if (a) go(a.to)
        } else if (activeIndex < actions.length + wishlistListings.length) {
          const w = wishlistListings[activeIndex - actions.length]
          if (w) go(`/listings/${w.slug}`)
        } else if (
          activeIndex <
          actions.length + wishlistListings.length + visibleSavedFilters.length
        ) {
          const f = visibleSavedFilters[activeIndex - actions.length - wishlistListings.length]
          if (f) go(`/browse?${f.search}`)
        } else {
          const l =
            listings[
              activeIndex - actions.length - wishlistListings.length - visibleSavedFilters.length
            ]
          if (l) go(`/listings/${l.slug}`)
        }
      }
    },
    [activeIndex, total, actions, wishlistListings, visibleSavedFilters, listings, go]
  )

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in data-[state=closed]:motion-safe:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content
          aria-modal="true"
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
              aria-expanded={true}
              aria-controls="palette-listbox"
              aria-autocomplete="list"
              aria-activedescendant={total > 0 ? `palette-row-${activeIndex}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex font-mono text-[0.65rem] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border border-line dark:border-night-line text-ink-mute dark:text-bone-mute">
              {t('common:keyboard.esc', { defaultValue: 'Esc' })}
            </kbd>
          </div>

          {showHistory && (
            <div className="px-1.5 py-1.5 border-b border-line dark:border-night-line">
              <div className="flex items-center justify-between gap-3 px-2 pb-1.5 pt-1">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                  {t('palette.recentSearches')}
                </p>
                <button
                  type="button"
                  onClick={() => history.clear()}
                  aria-label={t('common:history.clearAll', {
                    defaultValue: 'Clear all search history',
                  })}
                  className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral motion-safe:transition ease-expo focus-volt rounded"
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-sub dark:bg-night-sub border border-line dark:border-night-line text-[0.74rem] text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:border-volt-400 dark:hover:border-volt-500/60 motion-safe:transition ease-expo focus-volt"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {listingsQ.isPending && (
            <div
              role="status"
              aria-live="polite"
              className="px-3 py-6 text-sm text-ink-mute dark:text-bone-mute text-center"
            >
              {t('palette.loading')}
            </div>
          )}

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
                    active={i === activeIndex}
                    href={a.to}
                    go={go}
                    setActive={setActive}
                    IconComponent={a.icon}
                    iconClassName="w-4 h-4"
                    title={t(a.labelKey)}
                    subtitle={a.hint}
                    rowIndex={i}
                  />
                ))}
              </Section>
            )}

            {!trimmed && wishlistListings.length > 0 && (
              <Section label={t('palette.groups.wishlist')}>
                {wishlistListings.map((l, i) => {
                  const meta = LISTING_TYPE_META[l.type]
                  const rowIdx = actions.length + i
                  return (
                    <Row
                      key={l.id}
                      active={rowIdx === activeIndex}
                      href={`/listings/${l.slug}`}
                      go={go}
                      setActive={setActive}
                      IconComponent={Heart}
                      iconClassName="w-3.5 h-3.5 fill-current text-coral"
                      title={l.title}
                      subtitle={`${t('common:types.' + l.type, { defaultValue: meta?.label ?? l.type }).toLowerCase()} · @${l.author?.username ?? t('palette.unknownAuthor')}`}
                      rowIndex={rowIdx}
                    />
                  )
                })}
              </Section>
            )}

            {!trimmed && visibleSavedFilters.length > 0 && (
              <Section label={t('palette.groups.savedFilters')}>
                {visibleSavedFilters.map((f, i) => {
                  const rowIdx = actions.length + wishlistListings.length + i
                  return (
                    <Row
                      key={f.search}
                      active={rowIdx === activeIndex}
                      href={`/browse?${f.search}`}
                      go={go}
                      setActive={setActive}
                      IconComponent={Filter}
                      iconClassName="w-3.5 h-3.5"
                      title={f.label}
                      subtitle={`?${f.search}`}
                      rowIndex={rowIdx}
                    />
                  )
                })}
              </Section>
            )}

            {listings.length > 0 && (
              <Section
                label={trimmed ? t('palette.groups.listings') : t('palette.groups.topListings')}
              >
                {listings.map((l, i) => {
                  const meta = LISTING_TYPE_META[l.type]
                  const rowIdx =
                    actions.length + wishlistListings.length + visibleSavedFilters.length + i
                  return (
                    <Row
                      key={l.id}
                      active={rowIdx === activeIndex}
                      href={`/listings/${l.slug}`}
                      go={go}
                      setActive={setActive}
                      emoji={l.coverEmoji || meta.emoji}
                      title={l.title}
                      subtitle={`${t('common:types.' + l.type, { defaultValue: meta?.label ?? l.type }).toLowerCase()} · @${l.author?.username ?? t('palette.unknownAuthor')}`}
                      trailingPrice={l.priceCents ?? 0}
                      rowIndex={rowIdx}
                    />
                  )
                })}
              </Section>
            )}
          </div>

          {!listingsQ.isPending && total === 0 && (
            <div
              role="status"
              aria-live="polite"
              className="px-4 py-10 text-center text-sm text-ink-mute dark:text-bone-mute"
            >
              <p className="font-display text-[1.15rem] text-ink dark:text-bone mb-1">
                {t('palette.emptyTitle')}
              </p>
              <p>{t('palette.emptyBody')}</p>
            </div>
          )}

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

const Section = React.memo(function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div role="presentation" className="px-1.5 py-1.5">
      <p
        aria-hidden="true"
        className="px-2 pb-1.5 pt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute"
      >
        {label}
      </p>
      <div role="group" aria-label={label} className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  )
})

const Row = React.memo(function Row({
  active,
  href,
  go,
  setActive,
  IconComponent,
  iconClassName,
  emoji,
  title,
  subtitle,
  trailingPrice,
  rowIndex,
}: {
  active: boolean
  href: string
  go: (to: string) => void
  setActive: (i: number) => void
  IconComponent?: React.ElementType
  iconClassName?: string
  emoji?: string
  title: string
  subtitle?: string
  trailingPrice?: number
  rowIndex: number
}) {
  return (
    // Keyboard nav is owned by the combobox input via aria-activedescendant
    // (ArrowDown/Enter on the input drives selection), so per-option key
    // listeners are intentionally absent; tabIndex=-1 keeps it programmatically
    // focusable per the ARIA listbox pattern.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- combobox input handles Enter via aria-activedescendant
    <div
      role="option"
      id={`palette-row-${rowIndex}`}
      aria-selected={active}
      data-row={rowIndex}
      tabIndex={-1}
      onClick={() => go(href)}
      onMouseEnter={() => setActive(rowIndex)}
      className={cn(
        'group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left motion-safe:transition-colors ease-expo cursor-default',
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
        {IconComponent ? (
          <IconComponent className={iconClassName ?? 'w-4 h-4 text-ink-mute'} aria-hidden />
        ) : (
          <span
            aria-hidden
            className="inline-flex w-6 h-6 items-center justify-center rounded-md text-base"
          >
            {emoji}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink dark:text-bone truncate">{title}</span>
        {subtitle && (
          <span className="block text-[0.72rem] font-mono text-ink-mute dark:text-bone-mute truncate">
            {subtitle}
          </span>
        )}
      </span>
      {trailingPrice !== undefined && (
        <span
          className={cn(
            'shrink-0 inline-flex items-center font-mono text-[0.66rem] px-1.5 py-0.5 rounded-md',
            trailingPrice === 0
              ? 'bg-volt-300 text-ink'
              : 'bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft border border-line dark:border-night-line'
          )}
        >
          {formatPrice(trailingPrice)}
        </span>
      )}
      <ArrowRight
        className={cn(
          'w-3.5 h-3.5 shrink-0 text-ink-mute dark:text-bone-mute motion-safe:transition ease-expo',
          active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
        )}
        aria-hidden
      />
    </div>
  )
})

const Hint = React.memo(function Hint({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="inline-flex font-mono text-[0.62rem] uppercase px-1 py-0.5 rounded border border-line dark:border-night-line text-ink-soft dark:text-bone-soft">
        {k}
      </kbd>
      {label}
    </span>
  )
})
