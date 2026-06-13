import BrowseEmptyState from '@components/BrowseEmptyState'
import { buildActiveFilterRows } from '@components/browseEmptyStateUtils'
import CompareTray from '@components/CompareTray'
import FilterDrawer from '@components/FilterDrawer'
import FilterPanel from '@components/FilterPanel'
import { countActive, type FilterState } from '@components/filterState'
import ListingCard from '@components/ListingCard'
import SearchBar from '@components/SearchBar'
import { SkeletonGrid } from '@components/SkeletonCard'
import { useListings } from '@features/marketplace/queries'
import { usePageMeta } from '@hooks/usePageMeta'
import { useSavedFilters } from '@hooks/useSavedFilters'
import { useScrollRestore } from '@hooks/useScrollRestore'
import { useSearchHistory } from '@hooks/useSearchHistory'
import {
  LISTING_TYPE_META,
  ListingType as ListingTypeEnum,
  PromptTechnique as PromptTechniqueEnum,
  TECHNIQUE_META,
} from '@promptmarket/shared'
import { getErrorMessage } from '@services/api'
import { cn } from '@utils/cn'
import { modelLabel } from '@utils/format'
import {
  BadgeCheck,
  ChevronDown,
  Download,
  Layers3,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'

import type { ListingCard as ListingCardType } from '@/types'
import type { Difficulty, ListingType, PromptTechnique } from '@promptmarket/shared'
import type { TFunction } from 'i18next'

import { activeIntlLocale } from '@/i18n'

const VALID_TYPES = new Set<ListingType>(ListingTypeEnum.options)
const VALID_SORTS = ['newest', 'trending', 'top'] as const
const VALID_PRICES = ['all', 'free', 'paid'] as const
const VALID_DIFFICULTIES = new Set<Difficulty>(['beginner', 'intermediate', 'advanced'])
const VALID_TECHNIQUES = new Set<PromptTechnique>(PromptTechniqueEnum.options)
const VALID_SIGNALS = ['reviewed', 'used', 'multi-model', 'fresh'] as const

type Sort = (typeof VALID_SORTS)[number]
type SignalFilter = (typeof VALID_SIGNALS)[number]

const SIGNAL_OPTIONS = [
  { key: 'reviewed', Icon: BadgeCheck },
  { key: 'used', Icon: Download },
  { key: 'multi-model', Icon: Layers3 },
  { key: 'fresh', Icon: RefreshCw },
] as const

export default function BrowsePage() {
  useScrollRestore()
  const { t } = useTranslation('browse')
  const [params, setParams] = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [compareItems, setCompareItems] = useState<ListingCardType[]>([])
  const navigate = useNavigate()
  const { record: recordSearch } = useSearchHistory()
  // Destructure the stable useCallback refs — depending on the whole hook
  // object (a fresh literal each render) made the persist effect below re-run
  // every commit, writing to localStorage in an infinite loop once 2+ filters
  // were active.
  const { entries: savedEntries, save: saveFilter, remove: removeFilter } = useSavedFilters()

  const filters = useMemo<FilterState>(() => {
    const typesParam = params
      .getAll('type')
      .filter((t): t is ListingType => VALID_TYPES.has(t as ListingType))
    const modelsParam = params.getAll('model').filter(Boolean)
    const technique = params.get('technique')
    const difficulty = params.get('difficulty')
    const price = params.get('price')
    return {
      types: typesParam,
      models: modelsParam,
      technique:
        technique && VALID_TECHNIQUES.has(technique as PromptTechnique)
          ? (technique as PromptTechnique)
          : '',
      difficulty:
        difficulty && VALID_DIFFICULTIES.has(difficulty as Difficulty)
          ? (difficulty as Difficulty)
          : '',
      category: params.get('category') ?? '',
      price:
        price && (VALID_PRICES as readonly string[]).includes(price)
          ? (price as FilterState['price'])
          : 'all',
    }
  }, [params])

  const q = params.get('q') ?? ''
  const normalizedQuery = q.trim()
  const signalFilters = useMemo<SignalFilter[]>(
    () =>
      Array.from(
        new Set(
          params
            .getAll('signal')
            .filter((s): s is SignalFilter => (VALID_SIGNALS as readonly string[]).includes(s))
        )
      ),
    [params]
  )
  const sort: Sort = (() => {
    const s = params.get('sort')
    return s && (VALID_SORTS as readonly string[]).includes(s) ? (s as Sort) : 'newest'
  })()
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1)
  // Vendor is set by the home ModelTabs + footer "View all" links. It isn't a
  // FilterPanel control, so carry it as a preserved URL param + chip.
  const vendor = params.get('vendor') ?? ''

  // Reflect the active filters in the document title for clearer browser-tab
  // and history-stack labels.
  const titleSuffix = q
    ? t('meta.titleSearch', { q })
    : filters.category
      ? t('meta.titleCategory', {
          category: t('home:categories.labels.' + filters.category, {
            defaultValue: filters.category,
          }),
        })
      : sort === 'trending'
        ? t('meta.titleTrending')
        : sort === 'top'
          ? t('meta.titleTop')
          : t('meta.titleDefault')
  usePageMeta({
    title: `${titleSuffix} · PromptMarket`,
    description: t('meta.description'),
  })

  useEffect(() => {
    if (!normalizedQuery) return
    recordSearch(normalizedQuery)
  }, [normalizedQuery, recordSearch])

  const commit = useCallback(
    (next: FilterState, extra?: Record<string, string | number | null | undefined>) => {
      const merged = new URLSearchParams()
      // preserve sort + q + page (page resets on filter changes)
      if (q) merged.set('q', q)
      merged.set('sort', sort)
      if (vendor) merged.set('vendor', vendor)
      signalFilters.forEach((s) => merged.append('signal', s))
      next.types.forEach((t) => merged.append('type', t))
      next.models.forEach((m) => merged.append('model', m))
      if (next.technique) merged.set('technique', next.technique)
      if (next.difficulty) merged.set('difficulty', next.difficulty)
      if (next.category) merged.set('category', next.category)
      if (next.price !== 'all') merged.set('price', next.price)
      if (extra) {
        for (const [k, v] of Object.entries(extra)) {
          if (v === undefined || v === null || v === '') merged.delete(k)
          else merged.set(k, String(v))
        }
      }
      if (!merged.has('page')) merged.set('page', '1')
      setParams(merged, { replace: true })
    },
    [q, sort, vendor, signalFilters, setParams]
  )

  function updateExtras(extra: Record<string, string | number | null | undefined>) {
    commit(filters, extra)
  }

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  const onFilterChange = useCallback((next: FilterState) => commit(next, { page: 1 }), [commit])

  const setSignals = useCallback(
    (nextSignals: SignalFilter[]) => {
      const merged = new URLSearchParams(params)
      merged.delete('signal')
      nextSignals.forEach((s) => merged.append('signal', s))
      merged.set('page', '1')
      setParams(merged, { replace: true })
    },
    [params, setParams]
  )

  const toggleSignal = useCallback(
    (signal: SignalFilter) => {
      setSignals(
        signalFilters.includes(signal)
          ? signalFilters.filter((s) => s !== signal)
          : [...signalFilters, signal]
      )
    },
    [signalFilters, setSignals]
  )

  // Server-side params: the backend only accepts a single type/model. When the
  // user selects 2+ we must NOT pin the server to the first value — that would
  // return only that one type/model and the client union below could never
  // broaden past it. Instead we leave the param off (fetch the wider set) and
  // narrow to the selected union client-side. With exactly one selection we
  // still push it to the server so pagination stays accurate.
  const narrowTypes = filters.types.length > 1
  const narrowModels = filters.models.length > 1
  const { data, isPending, error } = useListings({
    type: narrowTypes ? undefined : filters.types[0],
    model: narrowModels ? undefined : filters.models[0],
    category: filters.category || undefined,
    technique: filters.technique || undefined,
    difficulty: filters.difficulty || undefined,
    vendor: vendor || undefined,
    signal: signalFilters.length > 0 ? signalFilters.join(',') : undefined,
    sort,
    q: q || undefined,
    free: filters.price === 'free' ? 'true' : filters.price === 'paid' ? 'false' : undefined,
    page,
    pageSize: 12,
  })

  const { items, effectiveTotal, effectiveTotalPages } = useMemo(() => {
    let narrowed = data?.items ?? []
    // Client-side narrowing for the cases the backend doesn't yet support.
    if (filters.types.length > 1) {
      narrowed = narrowed.filter((i) => filters.types.includes(i.type))
    }
    if (filters.models.length > 1) {
      narrowed = narrowed.filter((i) => (i.models ?? []).some((m) => filters.models.includes(m)))
    }
    if (filters.price === 'free') narrowed = narrowed.filter((i) => (i.priceCents ?? 0) === 0)
    if (filters.price === 'paid') narrowed = narrowed.filter((i) => (i.priceCents ?? 0) > 0)

    const total = data?.total ?? narrowed.length
    const totalPages = data?.totalPages ?? 1
    // When client-side multi-value narrowing is active the server's total/pages
    // describe the unfiltered set, so they'd overstate the result count and offer
    // pages whose entire contents get narrowed away. Reflect the narrowed grid
    // instead and collapse to a single page (the backend can't paginate the
    // multi-value union today). Price narrowing is handled server-side, so it
    // doesn't trigger this.
    const narrowing = narrowTypes || narrowModels
    return {
      items: narrowed,
      effectiveTotal: narrowing ? narrowed.length : total,
      effectiveTotalPages: narrowing ? 1 : totalPages,
    }
  }, [data, filters.types, filters.models, filters.price, narrowTypes, narrowModels])

  const activeCount = countActive(filters)
  const appliedCount = activeCount + signalFilters.length + (vendor ? 1 : 0)
  const fmt = new Intl.NumberFormat(activeIntlLocale())

  // Result-density rhythm: on the first page of a non-search browse, promote the
  // top listing to a full-width "lead drop" so the grid isn't a uniform wall of
  // identical cards. Text searches keep the even grid — when you're hunting a
  // keyword, uniform scannability beats editorial flourish. Needs >=4 items so a
  // lone lead never strands a near-empty grid beneath it.
  const showLead = !q && page === 1 && items.length >= 4
  const leadItem = showLead ? items[0] : null
  const gridItems = showLead ? items.slice(1) : items

  const toggleCompare = useCallback((listing: ListingCardType) => {
    setCompareItems((current) => {
      if (current.some((item) => item.id === listing.id)) {
        return current.filter((item) => item.id !== listing.id)
      }
      if (current.length >= 3) return current
      return [...current, listing]
    })
  }, [])

  const removeCompareItem = useCallback((id: string) => {
    setCompareItems((current) => current.filter((item) => item.id !== id))
  }, [])

  // Stable compare prop objects per item so memo(ListingCard) bails out correctly
  // when unrelated parent state changes (filters, pagination, search query).
  const compareSet = useMemo(() => new Set(compareItems.map((i) => i.id)), [compareItems])
  const comparePropsMap = useMemo(() => {
    const atLimit = compareSet.size >= 3
    return new Map(
      items.map((l) => {
        const selected = compareSet.has(l.id)
        return [l.id, { selected, disabled: atLimit && !selected, onToggle: toggleCompare }]
      })
    )
  }, [items, compareSet, toggleCompare])

  // Persist non-trivial filter combinations into the recent-filters store
  // so visitors can jump back without re-applying chip by chip.
  useEffect(() => {
    if (appliedCount < 2) return
    const label = describeFilters(filters, q, signalFilters, t)
    if (!label) return
    const search = params.toString()
    if (!search) return
    saveFilter(search, label)
  }, [appliedCount, filters, q, signalFilters, params, saveFilter, t])

  // Keep a ref with the latest pagination state so the keyboard handler never
  // closes over stale values (fixes the arrow-key pagination stale closure).
  const paginationRef = useRef({ page, effectiveTotalPages, updateExtras })
  useLayoutEffect(() => {
    paginationRef.current = { page, effectiveTotalPages, updateExtras }
  })

  // Cache browse-card focusable elements so j/k navigation doesn't call
  // querySelectorAll on every keystroke. Updated after each render that
  // produces a new items array (page change, filter change, initial load).
  const browseCardsRef = useRef<HTMLElement[]>([])
  useEffect(() => {
    browseCardsRef.current = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-browse-card] a, [data-browse-card] [role="link"]'
      )
    )
  }, [items])

  // ← / → keyboard pagination + j / k row navigation. Skips when a typing
  // target is focused so the arrow keys keep their default behavior inside
  // the search input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement) {
        const tag = t.tagName
        if (t.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          return
        }
      }
      const { page: p, effectiveTotalPages: totalPgs, updateExtras: upd } = paginationRef.current
      if (e.key === 'ArrowRight' && p < totalPgs) {
        e.preventDefault()
        upd({ page: p + 1 })
        return
      }
      if (e.key === 'ArrowLeft' && p > 1) {
        e.preventDefault()
        upd({ page: p - 1 })
        return
      }
      // Vim / Linear-style row navigation: focus the next / previous
      // listing card within the results grid. Falls back to the first
      // card if nothing's focused yet.
      if (e.key === 'j' || e.key === 'k') {
        const cards = browseCardsRef.current
        if (cards.length === 0) return
        const focused = document.activeElement as HTMLElement | null
        const idx = focused ? cards.indexOf(focused) : -1
        const next = e.key === 'j' ? Math.min(cards.length - 1, idx + 1) : Math.max(0, idx - 1)
        if (idx === -1) {
          e.preventDefault()
          cards[0]?.focus()
          cards[0]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          return
        }
        if (next !== idx) {
          e.preventDefault()
          cards[next]?.focus()
          cards[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="relative isolate overflow-hidden rounded-[1.75rem] surface-card mb-7 px-[clamp(1.5rem,3.5vw,2.75rem)] py-[clamp(1.5rem,3vw,2.25rem)]">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(at 12% 0%, oklch(0.92 0.18 122 / 0.32) 0, transparent 52%), radial-gradient(at 92% 120%, oklch(0.66 0.24 305 / 0.14) 0, transparent 55%)',
          }}
        />
        <div className="grain-layer" aria-hidden style={{ opacity: 0.05 }} />
        <div className="flex flex-col gap-x-10 gap-y-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2 min-w-0">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
              <span aria-hidden className="w-6 h-px bg-volt-500" />
              {t('eyebrow')}
            </p>
            <h1
              className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
              style={{ fontSize: 'var(--text-display-md)' }}
            >
              {q
                ? t('heading.search', { q })
                : filters.category
                  ? t('heading.category', {
                      category: t('home:categories.labels.' + filters.category, {
                        defaultValue: filters.category,
                      }),
                    })
                  : t('heading.default')}
            </h1>
            {!q && !filters.category && (
              <p className="text-ink-soft dark:text-bone-soft text-[0.95rem] leading-relaxed max-w-[46ch] [word-break:keep-all]">
                {t('hero.lede')}
              </p>
            )}
          </div>
          {!isPending && !error && (
            <p
              className="shrink-0 self-start lg:self-end inline-flex items-baseline gap-2 font-mono text-[0.78rem] text-ink-mute dark:text-bone-mute"
              aria-hidden
            >
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full bg-volt-500 volt-pulse translate-y-[-0.1em]"
              />
              {t('results.count', {
                count: effectiveTotal,
                formatted: fmt.format(effectiveTotal),
              })}
            </p>
          )}
        </div>
      </header>

      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 sm:flex-initial max-w-xl">
          <div role="search" aria-label={t('toolbar.searchLabel')}>
            <SearchBar
              initialValue={q}
              onSubmit={(v) => updateExtras({ q: v || undefined, page: 1 })}
              className="flex-1"
            />
          </div>
          <SortSelect value={sort} onChange={(s) => updateExtras({ sort: s, page: 1 })} />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 text-ink dark:text-bone hover:border-volt-400 dark:hover:border-volt-500/60 motion-safe:transition ease-expo focus-volt"
          >
            <SlidersHorizontal aria-hidden className="w-4 h-4" />
            {t('toolbar.filter')}
            {appliedCount > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[0.62rem] rounded-full bg-volt-300 text-ink font-mono font-semibold"
                aria-hidden
              >
                {appliedCount}
              </span>
            )}
            {appliedCount > 0 && (
              <span className="sr-only">{t('filters.activeCount', { count: appliedCount })}</span>
            )}
          </button>
        </div>
      </div>

      <SignalFilterBar value={signalFilters} onToggle={toggleSignal} />

      <div className="flex flex-col lg:flex-row gap-7 lg:gap-9">
        <aside className="hidden lg:block lg:w-72 shrink-0" aria-label={t('filters.sidebarLabel')}>
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5 shadow-[0_10px_30px_-22px_oklch(0.16_0.03_290/0.35)] dark:shadow-[0_10px_30px_-22px_oklch(0.16_0.03_290/0.65)] scrollbar-hide">
            <FilterPanel value={filters} onChange={onFilterChange} onReset={reset} />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {savedEntries.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2 mr-1">
                <span aria-hidden className="w-5 h-px bg-volt-500" />
                {t('saved.label')}
              </span>
              {savedEntries.map((f) => (
                <span
                  key={f.search}
                  className="group inline-flex items-center gap-1.5 rounded-full bg-canvas-sub/70 dark:bg-night-sub/70 border border-line dark:border-night-line text-[0.74rem] text-ink-soft dark:text-bone-soft hover:border-volt-400 dark:hover:border-volt-500/60 motion-safe:transition ease-expo"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/browse?${f.search}`)}
                    className="pl-2.5 py-1 hover:text-ink dark:hover:text-bone focus-volt rounded-l-full"
                  >
                    {f.label}
                  </button>
                  <button
                    type="button"
                    aria-label={t('saved.removeNamed', {
                      label: f.label,
                      defaultValue: 'Remove saved filter: {{label}}',
                    })}
                    onClick={() => removeFilter(f.search)}
                    className="pr-2 py-1 inline-flex items-center justify-center w-5 h-full text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral focus-volt rounded-r-full"
                  >
                    <X className="w-3 h-3" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          )}
          {(activeCount > 0 || vendor || signalFilters.length > 0) && (
            <div className="mb-4 rounded-2xl border border-volt-200/70 dark:border-volt-800/50 bg-volt-50/60 dark:bg-volt-900/15 px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2 mr-0.5">
                  <span aria-hidden className="w-5 h-px bg-volt-500" />
                  {t('active.label')}
                  <span className="text-volt-800 dark:text-volt-200 tabular-nums">
                    {t('active.count', { count: appliedCount })}
                  </span>
                </span>
                {vendor && (
                  <Chip
                    label={vendor}
                    onRemove={() => updateExtras({ vendor: undefined, page: 1 })}
                  />
                )}
                {filters.types.map((typeVal) => (
                  <Chip
                    key={`type-${typeVal}`}
                    label={t('common:types.' + typeVal, { defaultValue: typeVal })}
                    onRemove={() =>
                      commit(
                        { ...filters, types: filters.types.filter((x) => x !== typeVal) },
                        { page: 1 }
                      )
                    }
                  />
                ))}
                {filters.models.map((m) => (
                  <Chip
                    key={`model-${m}`}
                    label={modelLabel(m)}
                    onRemove={() =>
                      commit(
                        { ...filters, models: filters.models.filter((x) => x !== m) },
                        { page: 1 }
                      )
                    }
                  />
                ))}
                {filters.technique && (
                  <Chip
                    label={t('common:technique.' + filters.technique + '.label', {
                      defaultValue: filters.technique,
                    })}
                    onRemove={() => commit({ ...filters, technique: '' }, { page: 1 })}
                  />
                )}
                {filters.difficulty && (
                  <Chip
                    label={t('common:difficulty.' + filters.difficulty, {
                      defaultValue: filters.difficulty,
                    })}
                    onRemove={() => commit({ ...filters, difficulty: '' }, { page: 1 })}
                  />
                )}
                {filters.category && (
                  <Chip
                    label={t('home:categories.labels.' + filters.category, {
                      defaultValue: filters.category,
                    })}
                    onRemove={() => commit({ ...filters, category: '' }, { page: 1 })}
                  />
                )}
                {filters.price !== 'all' && (
                  <Chip
                    label={t('panel.price.' + filters.price)}
                    onRemove={() => commit({ ...filters, price: 'all' }, { page: 1 })}
                  />
                )}
                {signalFilters.map((signal) => (
                  <Chip
                    key={`signal-${signal}`}
                    label={t('signals.options.' + signal)}
                    onRemove={() => setSignals(signalFilters.filter((s) => s !== signal))}
                  />
                ))}
                <span aria-hidden className="mx-0.5 h-4 w-px bg-volt-200 dark:bg-volt-800/70" />
                <button
                  type="button"
                  onClick={reset}
                  className="text-[0.78rem] font-medium text-volt-700 dark:text-volt-300 hover:underline underline-offset-[3px] focus-volt rounded"
                >
                  {t('chips.reset')}
                </button>
              </div>
            </div>
          )}

          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="font-mono text-[0.78rem] text-ink-mute dark:text-bone-mute mb-5 tabular-nums"
          >
            {isPending
              ? t('results.loading')
              : t('results.count', {
                  count: effectiveTotal,
                  formatted: fmt.format(effectiveTotal),
                })}
            {q && (
              <>
                {' '}
                · <span className="text-ink dark:text-bone">"{q}"</span>
              </>
            )}
          </p>

          {error && (
            <p role="alert" className="text-coral-deep dark:text-coral text-sm font-mono mb-4">
              {getErrorMessage(error)}
            </p>
          )}

          {isPending ? (
            <SkeletonGrid count={8} />
          ) : items.length ? (
            <>
              {leadItem ? (
                <>
                  {/* Lead drop — a full-width editorial card breaks the uniform
                      grid so Browse keeps Home's rhythm on the first page.
                      Search results stay uniform (scannability over flourish). */}
                  <div className="mb-[var(--space-gap)]" data-browse-card>
                    <ListingCard
                      listing={leadItem}
                      variant="wide"
                      compare={comparePropsMap.get(leadItem.id)}
                    />
                  </div>
                  <div className="cards-fluid">
                    {gridItems.map((l) => (
                      <div key={l.id} data-browse-card>
                        <ListingCard listing={l} compare={comparePropsMap.get(l.id)} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="cards-fluid">
                  {items.map((l) => (
                    <div key={l.id} data-browse-card>
                      <ListingCard listing={l} highlight={q} compare={comparePropsMap.get(l.id)} />
                    </div>
                  ))}
                </div>
              )}

              {effectiveTotalPages > 1 && (
                <nav aria-label={t('pagination.label')}>
                  <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => updateExtras({ page: page - 1 })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 text-[0.86rem] text-ink dark:text-bone hover:border-volt-400 dark:hover:border-volt-500/60 hover:bg-canvas-deep dark:hover:bg-night-deep disabled:opacity-40 disabled:cursor-not-allowed motion-safe:transition ease-expo focus-volt"
                      >
                        <span aria-hidden>←</span> {t('pagination.prev')}
                      </button>
                      <span className="font-mono text-[0.78rem] tabular-nums text-ink-soft dark:text-bone-soft px-2">
                        {page} / {effectiveTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= effectiveTotalPages}
                        onClick={() => updateExtras({ page: page + 1 })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 text-[0.86rem] text-ink dark:text-bone hover:border-volt-400 dark:hover:border-volt-500/60 hover:bg-canvas-deep dark:hover:bg-night-deep disabled:opacity-40 disabled:cursor-not-allowed motion-safe:transition ease-expo focus-volt"
                      >
                        {t('pagination.next')} <span aria-hidden>→</span>
                      </button>
                    </div>
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute inline-flex items-center gap-1.5">
                      <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-[1.4rem] px-1 rounded border border-line dark:border-night-line bg-canvas-deep/60 dark:bg-night-deep/60">
                        ←
                      </kbd>
                      <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-[1.4rem] px-1 rounded border border-line dark:border-night-line bg-canvas-deep/60 dark:bg-night-deep/60">
                        →
                      </kbd>
                      {t('pagination.hint')}
                    </span>
                  </div>
                </nav>
              )}
            </>
          ) : (
            <BrowseEmptyState
              q={q}
              onClearAll={reset}
              activeFilters={buildActiveFilterRows({
                q,
                types: filters.types,
                models: filters.models,
                technique: filters.technique,
                difficulty: filters.difficulty,
                category: filters.category,
                price: filters.price,
                signals: signalFilters,
                removeType: (t) =>
                  commit({ ...filters, types: filters.types.filter((x) => x !== t) }, { page: 1 }),
                removeModel: (m) =>
                  commit(
                    { ...filters, models: filters.models.filter((x) => x !== m) },
                    { page: 1 }
                  ),
                removeTechnique: () => commit({ ...filters, technique: '' }, { page: 1 }),
                removeDifficulty: () => commit({ ...filters, difficulty: '' }, { page: 1 }),
                removeCategory: () => commit({ ...filters, category: '' }, { page: 1 }),
                removePrice: () => commit({ ...filters, price: 'all' }, { page: 1 }),
                removeQuery: () => updateExtras({ q: undefined, page: 1 }),
                removeSignal: (signal) => setSignals(signalFilters.filter((s) => s !== signal)),
              })}
            />
          )}
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        value={filters}
        onChange={onFilterChange}
        onReset={reset}
      />
      <CompareTray
        items={compareItems}
        onRemove={removeCompareItem}
        onClear={() => setCompareItems([])}
      />
    </div>
  )
}

function describeFilters(
  f: FilterState,
  q: string,
  signals: SignalFilter[],
  t: TFunction<'browse'>
): string {
  const parts: string[] = []
  if (q) parts.push(`"${q}"`)
  if (f.category)
    parts.push(t('home:categories.labels.' + f.category, { defaultValue: f.category }))
  if (f.types.length === 1) parts.push(LISTING_TYPE_META[f.types[0]].label)
  else if (f.types.length > 1) parts.push(t('describe.typesCount', { count: f.types.length }))
  if (f.technique) parts.push(TECHNIQUE_META[f.technique].label)
  if (f.difficulty)
    parts.push(t('common:difficulty.' + f.difficulty, { defaultValue: f.difficulty }))
  if (f.price === 'free') parts.push(t('describe.free'))
  if (f.price === 'paid') parts.push(t('describe.paid'))
  signals.forEach((s) => parts.push(t('signals.options.' + s)))
  return parts.slice(0, 4).join(' · ')
}

function SignalFilterBar({
  value,
  onToggle,
}: {
  value: SignalFilter[]
  onToggle: (signal: SignalFilter) => void
}) {
  const { t } = useTranslation('browse')
  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-2"
      aria-label={t('signals.label')}
      role="group"
    >
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute mr-1">
        {t('signals.label')}
      </span>
      {SIGNAL_OPTIONS.map(({ key, Icon }) => {
        const active = value.includes(key)
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(key)}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] font-medium motion-safe:transition ease-expo focus-volt',
              active
                ? 'border-volt-300 bg-volt-200/70 text-ink dark:border-volt-700 dark:bg-volt-900/50 dark:text-volt-100'
                : 'border-line bg-canvas-sub/60 text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:bg-night-sub/60 dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {t('signals.options.' + key)}
          </button>
        )
      })}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useTranslation('browse')
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-volt-100 dark:bg-volt-900/40 text-volt-800 dark:text-volt-200 border border-volt-200 dark:border-volt-800/70 px-2.5 py-1 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('chips.remove', { label })}
        className="ml-0.5 hover:text-ink dark:hover:text-bone motion-safe:transition ease-expo focus-volt rounded-full"
      >
        <X className="w-3 h-3" aria-hidden />
      </button>
    </span>
  )
}

function SortSelect({ value, onChange }: { value: Sort; onChange: (s: Sort) => void }) {
  const { t } = useTranslation('browse')
  return (
    <div className={cn('relative shrink-0')}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        aria-label={t('toolbar.sortLabel')}
        className="appearance-none pl-3.5 pr-8 py-2 rounded-full text-sm border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 text-ink dark:text-bone hover:border-volt-400 dark:hover:border-volt-500/60 motion-safe:transition ease-expo focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500"
      >
        <option value="newest">{t('sort.newest')}</option>
        <option value="trending">{t('sort.trending')}</option>
        <option value="top">{t('sort.top')}</option>
      </select>
      <ChevronDown
        className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-ink-mute dark:text-bone-mute pointer-events-none"
        aria-hidden
      />
    </div>
  )
}
