import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListingType } from '../lib/types';
import { useListings } from '../lib/queries';
import { getErrorMessage } from '../lib/api';
import ListingCard from '../components/ListingCard';
import FilterSidebar, { type Filters } from '../components/FilterSidebar';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const VALID_TYPES: ListingType[] = ['PROMPT', 'CLAUDE_MD', 'AGENT_MD'];
const VALID_SORTS = ['newest', 'trending', 'top'] as const;
const VALID_PRICES = ['all', 'free', 'paid'] as const;

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<Filters>(() => {
    const t = params.get('type');
    const sort = params.get('sort');
    const price = params.get('price');
    return {
      type: t && VALID_TYPES.includes(t as ListingType) ? (t as ListingType) : '',
      category: params.get('category') ?? '',
      sort:
        sort && (VALID_SORTS as readonly string[]).includes(sort)
          ? (sort as Filters['sort'])
          : 'newest',
      price:
        price && (VALID_PRICES as readonly string[]).includes(price)
          ? (price as Filters['price'])
          : 'all',
    };
  }, [params]);

  const q = params.get('q') ?? '';
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);

  function update(next: Record<string, string | number | undefined | null>) {
    const merged = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === null || v === '') merged.delete(k);
      else merged.set(k, String(v));
    }
    setParams(merged, { replace: true });
  }

  const { data, isPending, error } = useListings({
    type: filters.type || undefined,
    category: filters.category || undefined,
    sort: filters.sort,
    q: q || undefined,
    page,
    pageSize: 12,
  });

  let items = data?.items ?? [];
  if (filters.price === 'free') items = items.filter((i) => (i.priceCents ?? 0) === 0);
  if (filters.price === 'paid') items = items.filter((i) => (i.priceCents ?? 0) > 0);
  const total = data?.total ?? items.length;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 shrink-0">
          <FilterSidebar
            filters={filters}
            onChange={(next) =>
              update({
                type: next.type ?? '',
                category: next.category ?? '',
                sort: next.sort ?? 'newest',
                price: next.price ?? 'all',
                page: 1,
              })
            }
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Browse</h1>
            <div className="sm:w-80">
              <SearchBar
                initialValue={q}
                onSubmit={(v) => update({ q: v || undefined, page: 1 })}
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {isPending ? 'Loading…' : `${total} result${total === 1 ? '' : 's'}`}
            {q && (
              <>
                {' '}
                for <span className="font-medium text-gray-700">“{q}”</span>
              </>
            )}
          </p>

          {error && (
            <p className="text-red-600 text-sm mb-4">{getErrorMessage(error)}</p>
          )}

          {isPending ? (
            <Spinner className="py-16" label="Loading listings…" />
          ) : items.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => update({ page: page - 1 })}
                    className="px-3 py-1.5 rounded-md border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => update({ page: page + 1 })}
                    className="px-3 py-1.5 rounded-md border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
              description="Try removing some filters or a different search term."
            />
          )}
        </div>
      </div>
    </div>
  );
}
