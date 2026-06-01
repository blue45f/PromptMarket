import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MODELS } from '@promptmarket/shared'
import { Search, X } from 'lucide-react'
import { cn } from '@utils/cn'

interface ModelPickerProps {
  /** Currently selected model slugs. */
  value: string[]
  onChange: (next: string[]) => void
  /** Hide the search input — useful inside dense filter panels. */
  hideSearch?: boolean
  className?: string
}

export default function ModelPicker({
  value,
  onChange,
  hideSearch = false,
  className,
}: ModelPickerProps) {
  const { t } = useTranslation('home')
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const lc = query.trim().toLowerCase()
    const map = new Map<string, (typeof MODELS)[number][]>()
    for (const m of MODELS) {
      if (
        lc &&
        !m.label.toLowerCase().includes(lc) &&
        !m.vendor.toLowerCase().includes(lc) &&
        !m.family.toLowerCase().includes(lc)
      ) {
        continue
      }
      const arr = map.get(m.vendor) ?? []
      arr.push(m)
      map.set(m.vendor, arr)
    }
    return Array.from(map.entries())
  }, [query])

  function toggle(slug: string) {
    onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug])
  }

  return (
    <div className={cn('space-y-3', className)}>
      {!hideSearch && (
        <div className="relative">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute dark:text-bone-mute"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('modelPicker.searchPlaceholder')}
            aria-label={t('modelPicker.searchPlaceholder')}
            className="min-h-10 w-full pl-9 pr-3 py-2 rounded-full text-sm border border-line dark:border-night-line bg-canvas dark:bg-night text-ink dark:text-bone placeholder:text-ink-mute dark:placeholder:text-bone-mute focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500"
          />
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((slug) => {
            const m = MODELS.find((x) => x.slug === slug)
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggle(slug)}
                className="inline-flex min-h-8 items-center gap-1 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink text-xs font-medium px-2.5 py-1 hover:opacity-90 motion-safe:transition ease-expo focus-volt"
              >
                {m?.label ?? slug}
                <X className="w-3 h-3" aria-hidden />
              </button>
            )
          })}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto rounded-2xl border border-line dark:border-night-line divide-y divide-line/60 dark:divide-night-line/60 bg-canvas dark:bg-night">
        {grouped.length === 0 && (
          <p className="px-3 py-4 text-sm text-ink-mute dark:text-bone-mute">
            {t('modelPicker.noResults', { query })}
          </p>
        )}
        {grouped.map(([vendor, models]) => (
          <div key={vendor} className="p-2">
            <p className="px-2 pt-1 pb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300">
              {vendor}
            </p>
            <ul>
              {models.map((m) => {
                const checked = value.includes(m.slug)
                return (
                  <li key={m.slug}>
                    <label
                      className={cn(
                        'flex min-h-9 items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer motion-safe:transition ease-expo',
                        'hover:bg-canvas-deep dark:hover:bg-night-deep',
                        checked && 'bg-volt-100 dark:bg-volt-900/30'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(m.slug)}
                        className="accent-volt-500"
                      />
                      <span className="flex-1 truncate text-ink dark:text-bone">{m.label}</span>
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-ink-mute dark:text-bone-mute">
                        {m.family}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
