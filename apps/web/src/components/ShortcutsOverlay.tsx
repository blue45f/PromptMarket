import * as Dialog from '@radix-ui/react-dialog'
import { useAuthStore } from '@store/auth'
import { cn } from '@utils/cn'
import { Keyboard, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/* ---------------------------------------------------------------------------
 * ShortcutsOverlay — `?` opens a sheet listing every global keyboard
 * shortcut. Pure reference; the actual key bindings live next to the
 * features that own them (CommandPalette, useNavShortcuts).
 * ------------------------------------------------------------------------- */

const GROUPS: Array<{ titleKey: string; rows: Array<{ keys: string[]; labelKey: string }> }> = [
  {
    titleKey: 'shortcuts.groups.globalThis.title',
    rows: [
      { keys: ['⌘', 'K'], labelKey: 'shortcuts.groups.globalThis.openPalette' },
      { keys: ['Ctrl', 'K'], labelKey: 'shortcuts.groups.globalThis.openPaletteWin' },
      { keys: ['/'], labelKey: 'shortcuts.groups.globalThis.palette' },
      { keys: ['?'], labelKey: 'shortcuts.groups.globalThis.help' },
      { keys: ['Esc'], labelKey: 'shortcuts.groups.globalThis.closeDialog' },
    ],
  },
  {
    titleKey: 'shortcuts.groups.nav.title',
    rows: [
      { keys: ['g', 'h'], labelKey: 'shortcuts.groups.nav.home' },
      { keys: ['g', 'b'], labelKey: 'shortcuts.groups.nav.browse' },
      { keys: ['g', 'd'], labelKey: 'shortcuts.groups.nav.dashboard' },
      { keys: ['g', 's'], labelKey: 'shortcuts.groups.nav.sell' },
      { keys: ['g', 'l'], labelKey: 'shortcuts.groups.nav.login' },
    ],
  },
  {
    titleKey: 'shortcuts.groups.catalog.title',
    rows: [
      { keys: ['←'], labelKey: 'shortcuts.groups.catalog.prevPage' },
      { keys: ['→'], labelKey: 'shortcuts.groups.catalog.nextPage' },
      { keys: ['j'], labelKey: 'shortcuts.groups.catalog.nextCard' },
      { keys: ['k'], labelKey: 'shortcuts.groups.catalog.prevCard' },
    ],
  },
  {
    titleKey: 'shortcuts.groups.actions.title',
    rows: [
      { keys: ['c'], labelKey: 'shortcuts.groups.actions.create' },
      { keys: ['⌘', 'D'], labelKey: 'shortcuts.groups.actions.wishlist' },
    ],
  },
]

export default function ShortcutsOverlay() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation('errors')
  const user = useAuthStore((s) => s.user)

  const groups = (() => {
    if (!user?.isAdmin) return GROUPS
    return GROUPS.map((group) => {
      if (group.titleKey !== 'shortcuts.groups.nav.title') return group
      return {
        ...group,
        rows: [...group.rows, { keys: ['g', 'a'], labelKey: 'shortcuts.groups.nav.admin' }],
      }
    })
  })()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement) {
        const tag = t.tagName
        if (t.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA') return
      }
      e.preventDefault()
      setOpen((v) => !v)
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-modal="true"
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(540px,calc(100vw-2rem))]',
            'rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night shadow-2xl shadow-ink/40 overflow-hidden',
            'data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95'
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line dark:border-night-line">
            <div className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="inline-flex w-9 h-9 rounded-xl bg-ink dark:bg-bone text-volt-300 dark:text-ink items-center justify-center"
              >
                <Keyboard className="w-4 h-4" />
              </span>
              <div>
                <Dialog.Title className="font-display text-[1.1rem] font-semibold text-ink dark:text-bone leading-none tracking-tight">
                  {t('shortcuts.title')}
                </Dialog.Title>
                <Dialog.Description className="text-[0.78rem] text-ink-mute dark:text-bone-mute leading-tight mt-0.5">
                  {t('shortcuts.subtitle')}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('shortcuts.close')}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub motion-safe:transition ease-expo focus-volt"
              >
                <X aria-hidden className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {groups.map((g) => (
              <section key={g.titleKey} className="space-y-2.5">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
                  {t(g.titleKey)}
                </p>
                <ul className="space-y-1.5">
                  {g.rows.map((row) => (
                    <li key={row.labelKey} className="flex items-center justify-between gap-3">
                      <span className="text-[0.86rem] text-ink-soft dark:text-bone-soft">
                        {t(row.labelKey)}
                      </span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        {row.keys.map((k, i) => (
                          <kbd
                            key={k + i}
                            className="font-mono text-[0.7rem] min-w-[1.6rem] h-[1.6rem] inline-flex items-center justify-center px-1.5 rounded-md border border-line dark:border-night-line bg-canvas-deep dark:bg-night-deep text-ink dark:text-bone shadow-[0_1px_0_oklch(0.5_0.018_280_/_0.3)]"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-line dark:border-night-line text-[0.72rem] text-ink-mute dark:text-bone-mute flex items-center justify-between">
            <span>
              <kbd className="font-mono text-[0.66rem] px-1.5 py-0.5 rounded border border-line dark:border-night-line">
                ?
              </kbd>{' '}
              {t('shortcuts.reopenHint')}
            </span>
            <span className="font-mono uppercase tracking-[0.14em]">PromptMarket</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
