import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '@store/theme';
import { cn } from '@utils/cn';

const items: Array<{ key: ThemeMode; label: string; Icon: typeof Sun }> = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'System', Icon: Monitor },
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
          aria-label="Toggle theme"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition active:scale-95"
        >
          <Current className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[10rem] rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-lg"
        >
          {items.map(({ key, label, Icon }) => (
            <DropdownMenu.Item
              key={key}
              onSelect={() => setMode(key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition',
                'text-gray-700 dark:text-zinc-200',
                'data-[highlighted]:bg-indigo-50 data-[highlighted]:text-indigo-700',
                'dark:data-[highlighted]:bg-zinc-800 dark:data-[highlighted]:text-indigo-300',
                mode === key && 'font-semibold text-indigo-700 dark:text-indigo-300',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
