import { useMemo, useState } from 'react';
import { MODELS } from '@promptmarket/shared';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/cn';

interface ModelPickerProps {
  /** Currently selected model slugs. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Hide the search input — useful inside dense filter panels. */
  hideSearch?: boolean;
  className?: string;
}

export default function ModelPicker({
  value,
  onChange,
  hideSearch = false,
  className,
}: ModelPickerProps) {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const lc = query.trim().toLowerCase();
    const map = new Map<string, typeof MODELS[number][]>();
    for (const m of MODELS) {
      if (
        lc &&
        !m.label.toLowerCase().includes(lc) &&
        !m.vendor.toLowerCase().includes(lc) &&
        !m.family.toLowerCase().includes(lc)
      ) {
        continue;
      }
      const arr = map.get(m.vendor) ?? [];
      arr.push(m);
      map.set(m.vendor, arr);
    }
    return Array.from(map.entries());
  }, [query]);

  function toggle(slug: string) {
    onChange(
      value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug],
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {!hideSearch && (
        <div className="relative">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search models, vendors…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((slug) => {
            const m = MODELS.find((x) => x.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggle(slug)}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-600 text-white text-xs font-medium px-2.5 py-1 hover:bg-indigo-700 motion-safe:transition"
              >
                {m?.label ?? slug}
                <X className="w-3 h-3" />
              </button>
            );
          })}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
        {grouped.length === 0 && (
          <p className="px-3 py-4 text-sm text-gray-500 dark:text-zinc-400">
            No models match “{query}”.
          </p>
        )}
        {grouped.map(([vendor, models]) => (
          <div key={vendor} className="p-2">
            <p className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              {vendor}
            </p>
            <ul>
              {models.map((m) => {
                const checked = value.includes(m.slug);
                return (
                  <li key={m.slug}>
                    <label
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer',
                        'hover:bg-gray-50 dark:hover:bg-zinc-800',
                        checked && 'bg-indigo-50/40 dark:bg-indigo-950/30',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(m.slug)}
                        className="accent-indigo-600"
                      />
                      <span className="flex-1 truncate text-gray-900 dark:text-zinc-100">
                        {m.label}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                        {m.family}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
