import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MODELS } from '@promptmarket/shared';
import { useListings } from '../lib/queries';
import ListingCard from './ListingCard';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';
import { cn } from '../lib/cn';

/** The handful of families surfaced on the home page. Order matters. */
const FAMILY_TABS: Array<{ key: string; label: string }> = [
  { key: 'Claude', label: 'Claude' },
  { key: 'GPT', label: 'GPT' },
  { key: 'Gemini', label: 'Gemini' },
  { key: 'Llama', label: 'Llama' },
  { key: 'Tool', label: 'Tools' },
];

function pickVendorForFamily(family: string): string | undefined {
  // Use the first model in that family to grab the canonical vendor — this is
  // a stable proxy until the backend accepts `family=` directly.
  return MODELS.find((m) => m.family === family)?.vendor;
}

export default function ModelTabs() {
  const [active, setActive] = useState<string>(FAMILY_TABS[0].key);
  const vendor = pickVendorForFamily(active);
  const { data, isPending } = useListings({
    vendor: active === 'Tool' ? undefined : vendor,
    // For "Tools" tab, use the family-as-vendor heuristic: filter by a tool
    // model slug. For other tabs, vendor matches well (Anthropic, OpenAI, ...).
    model: active === 'Tool' ? 'claude-code' : undefined,
    pageSize: 4,
    sort: 'top',
  });

  const items = data?.items ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            By model
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Top listings, segmented by frontier model family.
          </p>
        </div>
        <Link
          to={`/browse?vendor=${encodeURIComponent(vendor ?? '')}`}
          className="text-sm font-medium text-indigo-700 dark:text-indigo-400 hover:underline"
        >
          See all →
        </Link>
      </div>
      <div
        role="tablist"
        aria-label="Model family"
        className="flex gap-1 mb-5 overflow-x-auto scrollbar-hide -mx-1 px-1"
      >
        {FAMILY_TABS.map(({ key, label }) => {
          const isActive = active === key;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              key={key}
              onClick={() => setActive(key)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap motion-safe:transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                isActive
                  ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          emoji="🛰️"
          title={`No listings yet for ${active}`}
          description="Be the first to publish one."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
