import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '@store/theme';
import { cn } from '@utils/cn';

const items: Array<{ key: ThemeMode; label: string; Icon: typeof Sun }> = [
  { key: 'light', label: '라이트', Icon: Sun },
  { key: 'dark', label: '다크', Icon: Moon },
  { key: 'system', label: '시스템', Icon: Monitor },
];

export default function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const Current = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="테마 전환"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub border border-transparent hover:border-line/70 dark:hover:border-night-line/60 focus-volt motion-safe:transition active:scale-95"
        >
          <Current className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[10rem] rounded-2xl border border-line dark:border-night-line surface-glass p-1.5 shadow-xl shadow-ink/10 dark:shadow-black/40"
        >
          {items.map(({ key, label, Icon }) => (
            <DropdownMenu.Item
              key={key}
              onSelect={() => setMode(key)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer outline-none motion-safe:transition',
                'text-ink-soft dark:text-bone-soft',
                'data-[highlighted]:bg-volt-100 data-[highlighted]:text-ink',
                'dark:data-[highlighted]:bg-volt-900 dark:data-[highlighted]:text-volt-100',
                mode === key && 'font-semibold text-ink dark:text-bone',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
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
  );
}
