import { useSearchHistory } from '@hooks/useSearchHistory'
import { cn } from '@utils/cn'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface SearchBarProps {
  initialValue?: string
  placeholder?: string
  onSubmit: (value: string) => void
  className?: string
}

export default function SearchBar({
  initialValue = '',
  placeholder,
  onSubmit,
  className,
}: SearchBarProps) {
  const { t } = useTranslation('common')
  const resolvedPlaceholder = placeholder ?? t('search.placeholder')
  const [valueState, setValueState] = useState({ initialValue, value: initialValue })
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef<HTMLFormElement>(null)
  const value = valueState.initialValue === initialValue ? valueState.value : initialValue
  const history = useSearchHistory()

  function setSearchValue(next: string) {
    setValueState({ initialValue, value: next })
  }

  // Close history when clicking anywhere outside the form.
  useEffect(() => {
    if (!focused) return
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [focused])

  function commit(v: string) {
    const trimmed = v.trim()
    if (trimmed) history.record(trimmed)
    setFocused(false)
    onSubmit(trimmed)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    commit(value)
  }

  const showHistory = focused && value.trim() === '' && history.entries.length > 0

  function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showHistory) return
    const len = history.entries.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % len)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + len) % len)
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const picked = history.entries[activeIdx]
      if (picked) {
        setSearchValue(picked)
        commit(picked)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setFocused(false)
      setActiveIdx(-1)
    }
  }

  return (
    <form ref={wrapRef} onSubmit={handleSubmit} className={cn('relative group', className)}>
      <Search
        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute dark:text-bone-mute pointer-events-none motion-safe:transition-colors ease-expo group-focus-within:text-volt-700 dark:group-focus-within:text-volt-300"
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setSearchValue(e.target.value)
          setActiveIdx(-1)
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={handleInputKey}
        placeholder={resolvedPlaceholder}
        aria-label={resolvedPlaceholder}
        aria-autocomplete="list"
        aria-expanded={showHistory}
        aria-controls={showHistory ? 'search-history-listbox' : undefined}
        aria-activedescendant={
          showHistory && activeIdx >= 0 ? `search-history-option-${activeIdx}` : undefined
        }
        role="combobox"
        className={cn(
          'w-full pl-10 pr-3 py-2 rounded-full text-sm',
          'border border-line dark:border-night-line',
          'bg-canvas/70 dark:bg-night-sub/70 backdrop-blur',
          'text-ink dark:text-bone',
          'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
          'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500 focus:bg-canvas dark:focus:bg-night-sub motion-safe:transition ease-expo'
        )}
      />
      {/* lg+: below that the navbar search is too narrow for an overlaid hint
          and the 640–767px drawer is touch-first anyway. */}
      <kbd
        aria-hidden
        title={t('search.commandPaletteHint')}
        className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[0.65rem] font-mono text-ink-mute dark:text-bone-mute border border-line/80 dark:border-night-line/80 bg-canvas-deep/60 dark:bg-night-deep/60 group-focus-within:opacity-0 motion-safe:transition ease-expo"
      >
        <span>⌘</span>K
      </kbd>

      {showHistory && (
        <div
          id="search-history-listbox"
          role="listbox"
          aria-label={t('search.recent')}
          className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night shadow-xl shadow-ink/10 dark:shadow-black/40 overflow-hidden"
        >
          <div
            role="presentation"
            className="flex items-center justify-between px-3.5 py-2 border-b border-line/70 dark:border-night-line/70"
          >
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
              {t('search.recent')}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={history.clear}
              aria-label={t('history.clearAll')}
              className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral motion-safe:transition ease-expo focus-volt rounded"
            >
              {t('actions.clear')}
            </button>
          </div>
          <div role="presentation" className="py-1.5">
            {history.entries.map((q, i) => (
              <div key={q} role="presentation">
                <div
                  onMouseEnter={() => setActiveIdx(i)}
                  className={cn(
                    'group/row w-full flex items-center gap-3 px-3.5 py-1.5 text-[0.86rem] motion-safe:transition ease-expo',
                    i === activeIdx
                      ? 'bg-volt-100 dark:bg-volt-900/30 text-ink dark:text-bone'
                      : 'text-ink-soft dark:text-bone-soft hover:bg-canvas-sub dark:hover:bg-night-sub'
                  )}
                >
                  {/* Keyboard nav is owned by the combobox input via
                      aria-activedescendant (ArrowDown/Enter commit the active
                      option), so per-option key listeners are intentionally
                      absent; tabIndex=-1 keeps it programmatically focusable. */}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- combobox input handles Enter via aria-activedescendant */}
                  <div
                    role="option"
                    id={`search-history-option-${i}`}
                    aria-selected={i === activeIdx}
                    tabIndex={-1}
                    // mouseDown fires before blur so the option stays clickable.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSearchValue(q)
                      commit(q)
                    }}
                    className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer focus-volt rounded"
                  >
                    <Search
                      className="w-3.5 h-3.5 text-ink-mute dark:text-bone-mute shrink-0"
                      aria-hidden
                    />
                    <span className="truncate">{q}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={t('search.removeFromHistory', { query: q })}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => history.remove(q)}
                    className="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 motion-safe:transition ease-expo inline-flex items-center justify-center w-5 h-5 shrink-0 rounded-full text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral focus-volt cursor-pointer"
                  >
                    <X className="w-3 h-3" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}
