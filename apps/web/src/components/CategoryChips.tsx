import { Link } from 'react-router-dom';
import { CATEGORIES } from '@promptmarket/shared';
import { cn } from '@utils/cn';

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

const LABELS: Record<string, string> = {
  Coding: '코딩',
  Writing: '글쓰기',
  Marketing: '마케팅',
  Productivity: '생산성',
  Agents: '에이전트',
  'Cursor Rules': 'Cursor 룰',
  MCP: 'MCP',
  Data: '데이터',
  Design: '디자인',
  Research: '리서치',
  Education: '교육',
  DevOps: 'DevOps',
  Security: '보안',
  Other: '기타',
};

export default function CategoryChips({ active }: CategoryChipsProps) {
  return (
    <div className="relative -mx-[clamp(1.25rem,4vw,3rem)] px-[clamp(1.25rem,4vw,3rem)]">
      {/* Edge fades */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-canvas dark:from-night to-transparent z-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-canvas dark:from-night to-transparent z-10"
      />
      <div
        className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide"
        role="navigation"
        aria-label="카테고리"
      >
        <Link
          to="/browse"
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[0.85rem] font-medium whitespace-nowrap',
            'motion-safe:transition focus-volt',
            !active
              ? 'bg-ink text-bone dark:bg-bone dark:text-ink shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.45)]'
              : 'bg-canvas-sub dark:bg-night-sub text-ink-soft dark:text-bone-soft border border-line dark:border-night-line hover:border-ink/40 dark:hover:border-bone/30 hover:text-ink dark:hover:text-bone',
          )}
        >
          <span aria-hidden>✦</span>
          전체
        </Link>
        {CATEGORIES.map((cat) => {
          const isActive = active === cat;
          return (
            <Link
              key={cat}
              to={`/browse?category=${encodeURIComponent(cat)}`}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[0.85rem] font-medium whitespace-nowrap',
                'motion-safe:transition focus-volt',
                isActive
                  ? 'bg-ink text-bone dark:bg-bone dark:text-ink shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.45)]'
                  : 'bg-canvas-sub dark:bg-night-sub text-ink-soft dark:text-bone-soft border border-line dark:border-night-line hover:border-volt-500 dark:hover:border-volt-500/70 hover:text-ink dark:hover:text-bone',
              )}
            >
              <span aria-hidden>{ICONS[cat] ?? '🏷️'}</span>
              {LABELS[cat] ?? cat}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
