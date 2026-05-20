import { CATEGORIES } from '@promptmarket/shared';
import type { ListingType } from '../lib/types';
import { typeLabel } from '../lib/format';

export interface Filters {
  type?: ListingType | '';
  category?: string;
  sort?: 'newest' | 'trending' | 'top';
  price?: 'all' | 'free' | 'paid';
}

interface FilterSidebarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  categories?: readonly string[];
}

const TYPES: ListingType[] = ['PROMPT', 'CLAUDE_MD', 'AGENT_MD'];

export default function FilterSidebar({ filters, onChange, categories }: FilterSidebarProps) {
  const cats = categories && categories.length ? categories : CATEGORIES;

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside className="bg-white rounded-xl border border-gray-100 p-4 space-y-5 sticky top-20">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</h4>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="type"
              checked={!filters.type}
              onChange={() => set('type', '')}
            />
            All
          </label>
          {TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="type"
                checked={filters.type === t}
                onChange={() => set('type', t)}
              />
              {typeLabel(t)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Category
        </h4>
        <select
          value={filters.category ?? ''}
          onChange={(e) => set('category', e.target.value)}
          className="w-full text-sm rounded-lg border border-gray-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sort</h4>
        <div className="space-y-1">
          {(['newest', 'trending', 'top'] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="radio"
                name="sort"
                checked={(filters.sort ?? 'newest') === s}
                onChange={() => set('sort', s)}
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price</h4>
        <div className="space-y-1">
          {(['all', 'free', 'paid'] as const).map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="radio"
                name="price"
                checked={(filters.price ?? 'all') === p}
                onChange={() => set('price', p)}
              />
              {p}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
