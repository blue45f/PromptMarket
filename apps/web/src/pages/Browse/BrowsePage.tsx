import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LISTING_TYPE_META,
  ListingType as ListingTypeEnum,
  PromptTechnique as PromptTechniqueEnum,
  TECHNIQUE_META,
} from '@promptmarket/shared';
import type {
  Difficulty,
  ListingType,
  PromptTechnique,
} from '@promptmarket/shared';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useListings } from '@features/marketplace/queries';
import { usePageMeta } from '@hooks/usePageMeta';
import { getErrorMessage } from '@services/api';
import { modelLabel } from '@utils/format';
import ListingCard from '@components/ListingCard';
import FilterPanel, {
  countActive,
  emptyFilters,
  type FilterState,
} from '@components/FilterPanel';
import FilterDrawer from '@components/FilterDrawer';
import SearchBar from '@components/SearchBar';
import { SkeletonGrid } from '@components/SkeletonCard';
import EmptyState from '@components/EmptyState';
import { cn } from '@utils/cn';

const VALID_TYPES = new Set<ListingType>(ListingTypeEnum.options);
const VALID_SORTS = ['newest', 'trending', 'top'] as const;
const VALID_PRICES = ['all', 'free', 'paid'] as const;
const VALID_DIFFICULTIES = new Set<Difficulty>([
  'beginner',
  'intermediate',
  'advanced',
]);
const VALID_TECHNIQUES = new Set<PromptTechnique>(PromptTechniqueEnum.options);

type Sort = (typeof VALID_SORTS)[number];

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters = useMemo<FilterState>(() => {
    const typesParam = params.getAll('type').filter((t): t is ListingType =>
      VALID_TYPES.has(t as ListingType),
    );
    const modelsParam = params.getAll('model').filter(Boolean);
    const technique = params.get('technique');
    const difficulty = params.get('difficulty');
    const price = params.get('price');
    return {
      types: typesParam,
      models: modelsParam,
      technique:
        technique && VALID_TECHNIQUES.has(technique as PromptTechnique)
          ? (technique as PromptTechnique)
          : '',
      difficulty:
        difficulty && VALID_DIFFICULTIES.has(difficulty as Difficulty)
          ? (difficulty as Difficulty)
          : '',
      category: params.get('category') ?? '',
      price:
        price && (VALID_PRICES as readonly string[]).includes(price)
          ? (price as FilterState['price'])
          : 'all',
    };
  }, [params]);

  const q = params.get('q') ?? '';
  const sort: Sort = (() => {
    const s = params.get('sort');
    return s && (VALID_SORTS as readonly string[]).includes(s) ? (s as Sort) : 'newest';
  })();
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);

  // Reflect the active filters in the document title for clearer browser-tab
  // and history-stack labels.
  const titleSuffix = q
    ? `"${q}" 검색 결과`
    : filters.category
      ? `${filters.category} 카탈로그`
      : sort === 'trending'
        ? '트렌딩'
        : sort === 'top'
          ? '인기'
          : '카탈로그 둘러보기';
  usePageMeta({
    title: `${titleSuffix} · PromptMarket`,
    description:
      '프롬프트, 스킬, MCP 서버, 에이전트, .cursorrules — 모델·난이도·기법별로 필터링하세요.',
  });

  function commit(next: FilterState, extra?: Record<string, string | number | null | undefined>) {
    const merged = new URLSearchParams();
    // preserve sort + q + page (page resets on filter changes)
    if (q) merged.set('q', q);
    merged.set('sort', sort);
    next.types.forEach((t) => merged.append('type', t));
    next.models.forEach((m) => merged.append('model', m));
    if (next.technique) merged.set('technique', next.technique);
    if (next.difficulty) merged.set('difficulty', next.difficulty);
    if (next.category) merged.set('category', next.category);
    if (next.price !== 'all') merged.set('price', next.price);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v === undefined || v === null || v === '') merged.delete(k);
        else merged.set(k, String(v));
      }
    }
    if (!merged.has('page')) merged.set('page', '1');
    setParams(merged, { replace: true });
  }

  function updateExtras(extra: Record<string, string | number | null | undefined>) {
    commit(filters, extra);
  }

  function reset() {
    setParams(new URLSearchParams(), { replace: true });
  }

  // Server-side params: a single type/model is supported by the backend; if
  // multiple are selected we fall back to the first and filter the rest in JS.
  const { data, isPending, error } = useListings({
    type: filters.types[0],
    model: filters.models[0],
    category: filters.category || undefined,
    technique: filters.technique || undefined,
    difficulty: filters.difficulty || undefined,
    sort,
    q: q || undefined,
    free: filters.price === 'free' ? 'true' : filters.price === 'paid' ? 'false' : undefined,
    page,
    pageSize: 12,
  });

  let items = data?.items ?? [];
  // Client-side narrowing for the cases the backend doesn't yet support.
  if (filters.types.length > 1) {
    items = items.filter((i) => filters.types.includes(i.type));
  }
  if (filters.models.length > 1) {
    items = items.filter((i) =>
      (i.models ?? []).some((m) => filters.models.includes(m)),
    );
  }
  if (filters.price === 'free') items = items.filter((i) => (i.priceCents ?? 0) === 0);
  if (filters.price === 'paid') items = items.filter((i) => (i.priceCents ?? 0) > 0);

  const total = data?.total ?? items.length;
  const totalPages = data?.totalPages ?? 1;
  const activeCount = countActive(filters);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          Browse
        </h1>
        <div className="flex items-center gap-2 flex-1 sm:flex-initial max-w-xl">
          <SearchBar
            initialValue={q}
            onSubmit={(v) => updateExtras({ q: v || undefined, page: 1 })}
            className="flex-1"
          />
          <SortSelect
            value={sort}
            onChange={(s) => updateExtras({ sort: s, page: 1 })}
          />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:border-indigo-300 motion-safe:transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full bg-indigo-600 text-white font-semibold">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-72 shrink-0">
          <div className="sticky top-24 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
            <FilterPanel
              value={filters}
              onChange={(next) => commit(next, { page: 1 })}
              onReset={reset}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {activeCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {filters.types.map((t) => (
                <Chip
                  key={`type-${t}`}
                  label={LISTING_TYPE_META[t].label}
                  onRemove={() =>
                    commit({ ...filters, types: filters.types.filter((x) => x !== t) }, { page: 1 })
                  }
                />
              ))}
              {filters.models.map((m) => (
                <Chip
                  key={`model-${m}`}
                  label={modelLabel(m)}
                  onRemove={() =>
                    commit(
                      { ...filters, models: filters.models.filter((x) => x !== m) },
                      { page: 1 },
                    )
                  }
                />
              ))}
              {filters.technique && (
                <Chip
                  label={TECHNIQUE_META[filters.technique].label}
                  onRemove={() => commit({ ...filters, technique: '' }, { page: 1 })}
                />
              )}
              {filters.difficulty && (
                <Chip
                  label={filters.difficulty}
                  onRemove={() => commit({ ...filters, difficulty: '' }, { page: 1 })}
                />
              )}
              {filters.category && (
                <Chip
                  label={filters.category}
                  onRemove={() => commit({ ...filters, category: '' }, { page: 1 })}
                />
              )}
              {filters.price !== 'all' && (
                <Chip
                  label={filters.price}
                  onRemove={() => commit({ ...filters, price: 'all' }, { page: 1 })}
                />
              )}
              <button
                type="button"
                onClick={reset}
                className="text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
            {isPending
              ? 'Loading…'
              : `${total.toLocaleString()} result${total === 1 ? '' : 's'}`}
            {q && (
              <>
                {' '}
                for{' '}
                <span className="font-medium text-gray-700 dark:text-zinc-200">
                  “{q}”
                </span>
              </>
            )}
          </p>

          {error && (
            <p className="text-rose-600 dark:text-rose-400 text-sm mb-4">
              {getErrorMessage(error)}
            </p>
          )}

          {isPending ? (
            <SkeletonGrid count={8} />
          ) : items.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateExtras({ page: page - 1 })}
                    className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-600 dark:text-zinc-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateExtras({ page: page + 1 })}
                    className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              emoji="🔍"
              title="No listings found"
              description="Try resetting filters or a different search term."
            />
          )}
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        value={filters}
        onChange={(next) => commit(next, { page: 1 })}
        onReset={reset}
      />
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800 px-2.5 py-1 text-xs font-medium capitalize">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: Sort;
  onChange: (s: Sort) => void;
}) {
  return (
    <div className={cn('relative shrink-0')}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        aria-label="Sort"
        className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:border-indigo-300 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="newest">Newest</option>
        <option value="trending">Trending</option>
        <option value="top">Top-rated</option>
      </select>
      <ChevronDown
        className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
