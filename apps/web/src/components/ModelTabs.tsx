import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { MODELS } from '@promptmarket/shared';
import { useListings } from '@features/marketplace/queries';
import ListingCard from './ListingCard';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';
import { cn } from '@utils/cn';

/** The handful of families surfaced on the home page. Order matters. */
const FAMILY_TABS: Array<{ key: string; label: string; mono: string }> = [
  { key: 'Claude', label: 'Claude', mono: 'anthropic' },
  { key: 'GPT', label: 'GPT', mono: 'openai' },
  { key: 'Gemini', label: 'Gemini', mono: 'google' },
  { key: 'Llama', label: 'Llama', mono: 'meta' },
  { key: 'Tool', label: '에디터', mono: 'tools' },
];

function pickVendorForFamily(family: string): string | undefined {
  return MODELS.find((m) => m.family === family)?.vendor;
}

export default function ModelTabs() {
  const [active, setActive] = useState<string>(FAMILY_TABS[0].key);
  const vendor = pickVendorForFamily(active);
  const { data, isPending } = useListings({
    vendor: active === 'Tool' ? undefined : vendor,
    model: active === 'Tool' ? 'claude-code' : undefined,
    pageSize: 4,
    sort: 'top',
  });

  const items = data?.items ?? [];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 lg:gap-6 mb-7 lg:mb-9">
        <div className="space-y-2">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
            05 / 벤더
          </p>
          <h2
            className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.03em] display-tight"
            style={{ fontSize: 'var(--text-display-sm)' }}
          >
            모델 패밀리별
          </h2>
          <p className="text-ink-mute dark:text-bone-mute text-[0.95rem] max-w-prose">
            프론티어 벤더별 인기 리스팅.
          </p>
        </div>
        <Link
          to={`/browse?vendor=${encodeURIComponent(vendor ?? '')}`}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line dark:border-night-line bg-canvas/60 dark:bg-night-sub/40 hover:border-ink dark:hover:border-bone text-ink dark:text-bone text-[0.83rem] font-medium motion-safe:transition focus-volt shrink-0"
        >
          전체 보기
          <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
        </Link>
      </div>
      <div
        role="tablist"
        aria-label="모델 패밀리"
        className="relative -mx-[clamp(1.25rem,4vw,3rem)] lg:mx-0 px-[clamp(1.25rem,4vw,3rem)] lg:px-0 mb-7 lg:mb-8 overflow-x-auto scrollbar-hide"
      >
        <div className="inline-flex gap-1.5 p-1.5 rounded-2xl bg-canvas-sub dark:bg-night-sub border border-line dark:border-night-line">
          {FAMILY_TABS.map(({ key, label, mono }) => {
            const isActive = active === key;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                key={key}
                onClick={() => setActive(key)}
                className={cn(
                  'relative px-4 py-2 rounded-xl text-[0.83rem] font-medium whitespace-nowrap motion-safe:transition focus-volt',
                  isActive
                    ? 'text-bone dark:text-ink'
                    : 'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone',
                )}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-ink dark:bg-bone rounded-xl shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.45)]"
                  />
                )}
                <span className="relative inline-flex items-center gap-2">
                  {label}
                  <span
                    className={cn(
                      'font-mono text-[0.62rem] tracking-[0.14em] uppercase',
                      isActive
                        ? 'text-volt-300 dark:text-volt-700'
                        : 'text-ink-mute dark:text-bone-mute',
                    )}
                  >
                    {mono}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {isPending ? (
        <div className="cards-fluid">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          emoji="🛰️"
          title={`${active} 카테고리에 아직 리스팅이 없어요`}
          description="첫 번째 게시자가 되어 보세요."
        />
      ) : (
        <div className="cards-fluid">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
