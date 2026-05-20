import { Link } from 'react-router-dom';
import { CATEGORIES } from '@promptmarket/shared';
import { cn } from '../lib/cn';

interface CategoryChipsProps {
  active?: string;
}

const ICONS: Record<string, string> = {
  Coding: '💻',
  Writing: '✍️',
  Marketing: '📣',
  Productivity: '⏱️',
  Agents: '🤖',
  'Cursor Rules': '🧱',
  MCP: '🔌',
  Data: '📊',
  Design: '🎨',
  Research: '🔬',
  Education: '🎓',
  DevOps: '⚙️',
  Security: '🛡️',
  Other: '🧩',
};

export default function CategoryChips({ active }: CategoryChipsProps) {
  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        role="navigation"
        aria-label="Categories"
      >
        <Link
          to="/browse"
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap',
            'border motion-safe:transition',
            !active
              ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/30'
              : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700',
          )}
        >
          <span aria-hidden>✨</span>
          All
        </Link>
        {CATEGORIES.map((cat) => {
          const isActive = active === cat;
          return (
            <Link
              key={cat}
              to={`/browse?category=${encodeURIComponent(cat)}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap',
                'border motion-safe:transition',
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/30'
                  : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700',
              )}
            >
              <span aria-hidden>{ICONS[cat] ?? '🏷️'}</span>
              {cat}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
