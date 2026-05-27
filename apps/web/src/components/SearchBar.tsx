import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@utils/cn';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  className?: string;
}

export default function SearchBar({
  initialValue = '',
  placeholder = '프롬프트, 에이전트, 스킬 검색…',
  onSubmit,
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative group', className)}>
      <Search
        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute dark:text-bone-mute pointer-events-none motion-safe:transition-colors group-focus-within:text-volt-700 dark:group-focus-within:text-volt-300"
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'w-full pl-10 pr-3 py-2 rounded-full text-sm',
          'border border-line dark:border-night-line',
          'bg-canvas/70 dark:bg-night-sub/70 backdrop-blur',
          'text-ink dark:text-bone',
          'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
          'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500 focus:bg-canvas dark:focus:bg-night-sub motion-safe:transition',
        )}
      />
      <kbd
        aria-hidden
        className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 rounded-md text-[0.65rem] font-mono text-ink-mute dark:text-bone-mute border border-line/80 dark:border-night-line/80 bg-canvas-deep/60 dark:bg-night-deep/60 group-focus-within:opacity-0 motion-safe:transition"
      >
        ⌘K
      </kbd>
    </form>
  );
}
