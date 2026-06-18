/**
 * SearchDeskPalette — NATIVE SearchDesk global search (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * A secondary, tenant-wide search palette powered by the PUBLISHED SDK
 * (`createSearchClient`, `pk_`), rendered with the app's own Radix Dialog shell
 * and OKLCH tokens — visually a sibling of the core ⌘K CommandPalette.
 *
 * Hotkey: Cmd/Ctrl + "/" (mod+/). It deliberately does NOT touch the app's core
 * catalog-aware ⌘K / bare-"/" command palette — that remains the primary, core
 * search. Active only when VITE_SEARCHDESK_URL is set (decided by the caller).
 *
 * a11y: role=combobox/listbox · arrow + Enter nav · Esc close · focus-visible ·
 * highlight markup is server-sanitized (`<mark>`) · prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { type SearchClient, type SearchHit } from '@heejun/deskcloud'
import { useDebounce } from '@hooks/useDebounce'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@utils/cn'
import { ArrowRight, Search } from 'lucide-react'
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const SEARCH_LIMIT = 12

/**
 * Render SearchDesk highlight markup safely. The Desk returns highlight strings
 * that wrap matches in `<mark>…</mark>`; rather than inject raw HTML, we split on
 * those tags and emit real `<mark>` React nodes (everything else is plain text).
 */
function renderHighlight(markup: string): ReactNode {
  const parts = markup.split(/(<mark>|<\/mark>)/i)
  const nodes: ReactNode[] = []
  let marking = false
  let key = 0
  for (const part of parts) {
    if (/^<mark>$/i.test(part)) {
      marking = true
      continue
    }
    if (/^<\/mark>$/i.test(part)) {
      marking = false
      continue
    }
    if (part === '') continue
    nodes.push(
      marking ? (
        <mark
          key={key++}
          className="rounded-sm bg-volt-200 px-0.5 text-ink dark:bg-volt-900/60 dark:text-volt-100"
        >
          {part}
        </mark>
      ) : (
        <Fragment key={key++}>{part}</Fragment>
      )
    )
  }
  return nodes
}

interface SearchDeskPaletteProps {
  client: SearchClient
}

export default function SearchDeskPalette({ client }: SearchDeskPaletteProps) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounced = useDebounce(q, 200)

  // Bind Cmd/Ctrl + "/" — never the bare "/" or ⌘K owned by the core palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [])

  // Run the search whenever the debounced query changes (while open). All state
  // mutations happen inside async callbacks so nothing is set synchronously in
  // the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!open) return
    const trimmed = debounced.trim()
    const ctrl = new AbortController()
    let cancelled = false

    if (!trimmed) {
      // Clear results off the synchronous path.
      Promise.resolve().then(() => {
        if (cancelled) return
        setHits([])
        setLoading(false)
      })
      return () => {
        cancelled = true
      }
    }

    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true)
    })
    client
      .search({ q: trimmed, limit: SEARCH_LIMIT })
      .then((res) => {
        if (cancelled) return
        setHits(res.hits)
        setActive(0)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled && !ctrl.signal.aborted) setLoading(false)
      })
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [debounced, open, client])

  const close = useCallback(() => setOpen(false), [])

  const goTo = useCallback(
    (hit: SearchHit) => {
      close()
      if (hit.url) globalThis.location.assign(hit.url)
    },
    [close]
  )

  const onInputKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (hits.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => (i + 1) % hits.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i - 1 + hits.length) % hits.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const hit = hits[active]
        if (hit) goTo(hit)
      }
    },
    [hits, active, goTo]
  )

  const trimmed = debounced.trim()

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-modal="true"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
          className={cn(
            'fixed left-1/2 top-[14vh] z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2',
            'rounded-2xl border border-line bg-canvas shadow-2xl shadow-ink/40 dark:border-night-line dark:bg-night',
            'data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95'
          )}
        >
          <Dialog.Title className="sr-only">
            {t('searchDesk.title', { defaultValue: 'Search everything' })}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            {t('searchDesk.description', {
              defaultValue: 'Search across the site. Use arrow keys to navigate results.',
            })}
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 dark:border-night-line">
            <Search className="w-4 h-4 shrink-0 text-ink-mute dark:text-bone-mute" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onInputKey}
              placeholder={t('searchDesk.placeholder', { defaultValue: 'Search everything…' })}
              className="flex-1 bg-transparent text-ink outline-none placeholder:text-ink-mute dark:text-bone dark:placeholder:text-bone-mute"
              aria-label={t('searchDesk.inputLabel', { defaultValue: 'Search query' })}
              role="combobox"
              aria-expanded
              aria-controls="searchdesk-listbox"
              aria-autocomplete="list"
              aria-activedescendant={hits.length > 0 ? `searchdesk-row-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex rounded border border-line px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-mute dark:border-night-line dark:text-bone-mute">
              {t('keyboard.esc', { defaultValue: 'Esc' })}
            </kbd>
          </div>

          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="px-3 py-6 text-center text-sm text-ink-mute dark:text-bone-mute"
            >
              {t('searchDesk.loading', { defaultValue: 'Searching…' })}
            </div>
          )}

          {!loading && trimmed && hits.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-ink-mute dark:text-bone-mute">
              {t('searchDesk.empty', { defaultValue: 'No matches found.' })}
            </div>
          )}

          {hits.length > 0 && (
            <ul
              id="searchdesk-listbox"
              role="listbox"
              aria-label={t('searchDesk.title', { defaultValue: 'Search everything' })}
              className="max-h-[60vh] overflow-y-auto p-2"
            >
              {hits.map((hit, i) => {
                const isActive = i === active
                return (
                  <li
                    key={hit.id}
                    id={`searchdesk-row-${i}`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => goTo(hit)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left motion-safe:transition ease-expo focus-volt',
                        isActive
                          ? 'bg-canvas-sub dark:bg-night-sub'
                          : 'hover:bg-canvas-sub dark:hover:bg-night-sub'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.88rem] font-medium text-ink dark:text-bone">
                          {renderHighlight(hit.titleHighlight || hit.title)}
                        </p>
                        {hit.snippet && (
                          <p className="mt-0.5 truncate text-[0.76rem] text-ink-soft dark:text-bone-soft">
                            {renderHighlight(hit.snippet)}
                          </p>
                        )}
                      </div>
                      {hit.category && (
                        <span className="shrink-0 rounded-full bg-canvas-deep px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-ink-mute dark:bg-night-deep dark:text-bone-mute">
                          {hit.category}
                        </span>
                      )}
                      <ArrowRight
                        className={cn(
                          'w-3.5 h-3.5 shrink-0 text-ink-mute dark:text-bone-mute',
                          isActive ? 'opacity-100' : 'opacity-0'
                        )}
                        aria-hidden
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
