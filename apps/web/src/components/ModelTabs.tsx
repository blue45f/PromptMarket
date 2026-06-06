import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
import { MODELS } from '@promptmarket/shared'
import { useListings } from '@features/marketplace/queries'
import ListingCard from './ListingCard'
import SkeletonCard from './SkeletonCard'
import EmptyState from './EmptyState'
import { cn } from '@utils/cn'

/** The handful of families surfaced on the home page. Order matters.
 *  `labelKey` (when set) is resolved through i18n; otherwise `label` is a
 *  brand name shown verbatim. */
const FAMILY_TABS: Array<{ key: string; label: string; labelKey?: string; mono: string }> = [
  { key: 'Claude', label: 'Claude', mono: 'anthropic' },
  { key: 'GPT', label: 'GPT', mono: 'openai' },
  { key: 'Gemini', label: 'Gemini', mono: 'google' },
  { key: 'Llama', label: 'Llama', mono: 'meta' },
  { key: 'Tool', label: 'Editors', labelKey: 'models.toolTab', mono: 'tools' },
]

function pickVendorForFamily(family: string): string | undefined {
  return MODELS.find((m) => m.family === family)?.vendor
}

const TABPANEL_ID = 'tabpanel-model'

function tabId(key: string) {
  return `tab-model-${key}`
}

export default function ModelTabs() {
  const { t } = useTranslation('home')
  const [active, setActive] = useState<string>(FAMILY_TABS[0].key)
  const vendor = pickVendorForFamily(active)
  const { data, isPending, isFetching, isError, refetch } = useListings({
    vendor: active === 'Tool' ? undefined : vendor,
    model: active === 'Tool' ? 'claude-code' : undefined,
    pageSize: 4,
    sort: 'top',
  })

  const items = data?.items ?? []

  // The empty-state title needs the *displayed* tab label, not the internal
  // key (e.g. the "Tool" tab shows a translated label, not "Tool").
  const activeTab = FAMILY_TABS.find((tb) => tb.key === active)
  const activeLabel = activeTab?.labelKey ? t(activeTab.labelKey) : (activeTab?.label ?? active)

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 lg:gap-6 mb-7 lg:mb-9">
        <div className="space-y-2">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
            {t('models.chapter')}
          </p>
          <h2
            className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.03em] display-tight"
            style={{ fontSize: 'var(--text-display-sm)' }}
          >
            {t('models.title')}
          </h2>
          <p className="text-ink-mute dark:text-bone-mute text-[0.95rem] max-w-prose">
            {t('models.kicker')}
          </p>
        </div>
        <Link
          to={
            active === 'Tool'
              ? '/browse?model=claude-code'
              : `/browse?vendor=${encodeURIComponent(vendor ?? '')}`
          }
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line dark:border-night-line bg-canvas/60 dark:bg-night-sub/40 hover:border-ink dark:hover:border-bone text-ink dark:text-bone text-[0.83rem] font-medium motion-safe:transition ease-expo focus-volt shrink-0"
        >
          {t('common.viewAll')}
          <ArrowUpRight
            aria-hidden
            className="w-4 h-4 motion-safe:transition-transform ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
      <div
        role="tablist"
        aria-label={t('models.tablistAria')}
        className="relative -mx-[clamp(1.25rem,4vw,3rem)] lg:mx-0 px-[clamp(1.25rem,4vw,3rem)] lg:px-0 mb-7 lg:mb-8 overflow-x-auto scrollbar-hide"
        onKeyDown={(ev) => {
          const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
          if (!keys.includes(ev.key)) return
          ev.preventDefault()
          const currentIndex = FAMILY_TABS.findIndex((tb) => tb.key === active)
          let nextIndex: number
          if (ev.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % FAMILY_TABS.length
          } else if (ev.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + FAMILY_TABS.length) % FAMILY_TABS.length
          } else if (ev.key === 'Home') {
            nextIndex = 0
          } else {
            nextIndex = FAMILY_TABS.length - 1
          }
          const nextKey = FAMILY_TABS[nextIndex].key
          setActive(nextKey)
          document.getElementById(tabId(nextKey))?.focus()
        }}
      >
        <div className="inline-flex gap-1.5 p-1.5 rounded-2xl bg-canvas-sub dark:bg-night-sub border border-line dark:border-night-line">
          {FAMILY_TABS.map(({ key, label, labelKey, mono }) => {
            const isActive = active === key
            const tabLabel = labelKey ? t(labelKey) : label
            return (
              <button
                type="button"
                role="tab"
                id={tabId(key)}
                aria-selected={isActive}
                aria-controls={TABPANEL_ID}
                tabIndex={isActive ? 0 : -1}
                key={key}
                onClick={() => setActive(key)}
                className={cn(
                  'relative px-4 py-2 rounded-xl text-[0.83rem] font-medium whitespace-nowrap motion-safe:transition ease-expo focus-volt',
                  isActive
                    ? 'text-bone dark:text-ink'
                    : 'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone'
                )}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-ink dark:bg-bone rounded-xl shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.45)]"
                  />
                )}
                <span className="relative inline-flex items-center gap-2">
                  {tabLabel}
                  <span
                    className={cn(
                      'font-mono text-[0.62rem] tracking-[0.14em] uppercase',
                      isActive
                        ? 'text-volt-300 dark:text-volt-700'
                        : 'text-ink-mute dark:text-bone-mute'
                    )}
                  >
                    {mono}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div role="tabpanel" id={TABPANEL_ID} aria-labelledby={tabId(active)}>
        {isError ? (
          <div className="py-12 text-center text-sm text-ink-soft dark:text-bone-soft">
            <p>{t('modelTabs.error')}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="mt-2 text-volt-700 dark:text-volt-400 underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('common:retry')}
            </button>
          </div>
        ) : isPending ? (
          <div className="cards-fluid">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            variant="discover"
            emoji="🛰️"
            title={t('models.emptyTitle', { family: activeLabel })}
            description={t('models.emptyDescription')}
          />
        ) : (
          <div className="cards-fluid">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
