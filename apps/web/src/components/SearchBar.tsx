import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchHistory } from '@hooks/useSearchHistory';
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
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLFormElement>(null);
  const history = useSearchHistory();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Close history when clicking anywhere outside the form.
  useEffect(() => {
    if (!focused) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [focused]);

  function commit(v: string) {
    const trimmed = v.trim();
    if (trimmed) history.record(trimmed);
    setFocused(false);
    onSubmit(trimmed);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    commit(value);
  }

  const showHistory = focused && value.trim() === '' && history.entries.length > 0;

  return (
    <form
      ref={wrapRef}
      onSubmit={handleSubmit}
      className={cn('relative group', className)}
    >
      <Search
        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute dark:text-bone-mute pointer-events-none motion-safe:transition-colors group-focus-within:text-volt-700 dark:group-focus-within:text-volt-300"
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
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
        title="명령 팔레트 열기"
        className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[0.65rem] font-mono text-ink-mute dark:text-bone-mute border border-line/80 dark:border-night-line/80 bg-canvas-deep/60 dark:bg-night-deep/60 group-focus-within:opacity-0 motion-safe:transition"
      >
        <span>⌘</span>K
      </kbd>

      {showHistory && (
        <div
          role="listbox"
          aria-label="최근 검색"
          className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night shadow-xl shadow-ink/10 dark:shadow-black/40 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-line/70 dark:border-night-line/70">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
              최근 검색
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={history.clear}
              className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral motion-safe:transition focus-volt rounded"
            >
              지우기
            </button>
          </div>
          <ul className="py-1.5">
            {history.entries.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  // mouseDown fires before blur so the option stays clickable.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setValue(q);
                    commit(q);
                  }}
                  className="group/row w-full flex items-center justify-between gap-3 px-3.5 py-1.5 text-left text-[0.86rem] text-ink-soft dark:text-bone-soft hover:bg-canvas-sub dark:hover:bg-night-sub motion-safe:transition"
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Search className="w-3.5 h-3.5 text-ink-mute dark:text-bone-mute shrink-0" aria-hidden />
                    <span className="truncate">{q}</span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="기록에서 지우기"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      history.remove(q);
                    }}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        history.remove(q);
                      }
                    }}
                    className="opacity-0 group-hover/row:opacity-100 motion-safe:transition inline-flex items-center justify-center w-5 h-5 rounded-full text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral cursor-pointer"
                  >
                    <X className="w-3 h-3" aria-hidden />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
