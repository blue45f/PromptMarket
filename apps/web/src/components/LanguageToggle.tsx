import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGS, normalizeLang, type Lang } from '@/i18n'
import { cn } from '@utils/cn'

/** Language switcher. Mirrors ThemeToggle so the nav chrome keeps one
 *  control vocabulary: same trigger footprint, same active-dot affordance. */
export default function LanguageToggle() {
  const { t, i18n } = useTranslation('common')
  const active: Lang = normalizeLang(i18n.resolvedLanguage ?? i18n.language)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t('lang.switchLabel')}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub border border-transparent hover:border-line/70 dark:hover:border-night-line/60 focus-volt motion-safe:transition active:scale-95"
        >
          <Languages className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[10rem] rounded-2xl border border-line dark:border-night-line surface-glass p-1.5 shadow-xl shadow-ink/10 dark:shadow-black/40"
        >
          {SUPPORTED_LANGS.map((lng) => (
            <DropdownMenu.Item
              key={lng}
              onSelect={() => {
                void i18n.changeLanguage(lng)
              }}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer outline-none motion-safe:transition',
                'text-ink-soft dark:text-bone-soft',
                'data-[highlighted]:bg-volt-100 data-[highlighted]:text-ink',
                'dark:data-[highlighted]:bg-volt-900 dark:data-[highlighted]:text-volt-100',
                active === lng && 'font-semibold text-ink dark:text-bone'
              )}
            >
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] w-6 shrink-0">
                {lng}
              </span>
              {t(`lang.${lng}`)}
              {active === lng && (
                <span
                  aria-hidden
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-volt-500 volt-pulse"
                />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
