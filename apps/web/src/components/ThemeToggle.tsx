import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useThemeStore, type ThemeMode } from '@store/theme'
import { cn } from '@utils/cn'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const items: Array<{ key: ThemeMode; Icon: typeof Sun }> = [
  { key: 'light', Icon: Sun },
  { key: 'dark', Icon: Moon },
  { key: 'system', Icon: Monitor },
]

export default function ThemeToggle() {
  const { t } = useTranslation('common')
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const Current = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {/* Trigger keeps its 36px visual footprint; the ::after overlay grows
            the hit area to 44px on coarse (touch) pointers only. */}
        <button
          type="button"
          aria-label={t('theme.switchLabel')}
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub border border-transparent hover:border-line/70 dark:hover:border-night-line/60 focus-volt motion-safe:transition ease-expo active:scale-95 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
        >
          <Current aria-hidden className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[10rem] rounded-2xl border border-line dark:border-night-line surface-glass p-1.5 shadow-xl shadow-ink/10 dark:shadow-night/40"
        >
          {items.map(({ key, Icon }) => (
            <DropdownMenu.Item
              key={key}
              onSelect={() => setMode(key)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer outline-none motion-safe:transition ease-expo',
                'text-ink-soft dark:text-bone-soft',
                'data-[highlighted]:bg-volt-100 data-[highlighted]:text-ink',
                'dark:data-[highlighted]:bg-volt-900 dark:data-[highlighted]:text-volt-100',
                mode === key && 'font-semibold text-ink dark:text-bone'
              )}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {t(`theme.${key}`)}
              {mode === key && (
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
