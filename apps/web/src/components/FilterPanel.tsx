import {
  CATEGORIES,
  LISTING_TYPE_META,
  ListingType as ListingTypeEnum,
  PromptTechnique as PromptTechniqueEnum,
  TECHNIQUE_META,
  type Difficulty,
  type ListingType,
  type PromptTechnique,
} from '@promptmarket/shared';
import ModelPicker from './ModelPicker';
import { cn } from '@utils/cn';

export interface FilterState {
  types: ListingType[];
  models: string[];
  technique: PromptTechnique | '';
  difficulty: Difficulty | '';
  category: string;
  price: 'all' | 'free' | 'paid';
}

export function emptyFilters(): FilterState {
  return {
    types: [],
    models: [],
    technique: '',
    difficulty: '',
    category: '',
    price: 'all',
  };
}

export function countActive(f: FilterState): number {
  return (
    f.types.length +
    f.models.length +
    (f.technique ? 1 : 0) +
    (f.difficulty ? 1 : 0) +
    (f.category ? 1 : 0) +
    (f.price !== 'all' ? 1 : 0)
  );
}

interface FilterPanelProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

const ALL_TYPES = ListingTypeEnum.options;
const ALL_TECHNIQUES = PromptTechniqueEnum.options;
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

function SectionHeader({ children }: { children: string }) {
  return (
    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
      {children}
    </h4>
  );
}

export default function FilterPanel({
  value,
  onChange,
  onReset,
}: FilterPanelProps) {
  function set<K extends keyof FilterState>(k: K, v: FilterState[K]) {
    onChange({ ...value, [k]: v });
  }
  function toggleType(t: ListingType) {
    set(
      'types',
      value.types.includes(t)
        ? value.types.filter((x) => x !== t)
        : [...value.types, t],
    );
  }
  const showTechnique =
    value.types.length === 0 || value.types.includes('PROMPT');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          Filters
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:underline focus-visible:outline-none"
        >
          Reset all
        </button>
      </div>

      <section>
        <SectionHeader>Type</SectionHeader>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPES.map((t) => {
            const meta = LISTING_TYPE_META[t];
            const active = value.types.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ring-1 motion-safe:transition',
                  active
                    ? `${meta.pill} ring-offset-1 ring-2 dark:ring-offset-zinc-950`
                    : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 ring-gray-200 dark:ring-zinc-700 hover:ring-indigo-300',
                )}
              >
                <span aria-hidden>{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader>Models</SectionHeader>
        <ModelPicker
          value={value.models}
          onChange={(next) => set('models', next)}
        />
      </section>

      {showTechnique && (
        <section>
          <SectionHeader>Prompt technique</SectionHeader>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={value.technique === ''}
                onChange={() => set('technique', '')}
                className="accent-indigo-600"
              />
              Any
            </label>
            {ALL_TECHNIQUES.map((tk) => (
              <label key={tk} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={value.technique === tk}
                  onChange={() => set('technique', tk)}
                  className="accent-indigo-600"
                />
                <span className="text-gray-700 dark:text-zinc-300">
                  {TECHNIQUE_META[tk].label}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader>Category</SectionHeader>
        <div className="grid grid-cols-2 gap-1">
          {CATEGORIES.map((c) => {
            const active = value.category === c;
            return (
              <label
                key={c}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-md text-sm cursor-pointer',
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800',
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => set('category', active ? '' : c)}
                  className="accent-indigo-600"
                />
                <span className="truncate">{c}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader>Difficulty</SectionHeader>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800">
          {(['', ...DIFFICULTIES] as const).map((d) => {
            const active = value.difficulty === d;
            return (
              <button
                key={d || 'all'}
                type="button"
                onClick={() => set('difficulty', d as FilterState['difficulty'])}
                className={cn(
                  'text-xs font-medium px-2 py-1.5 rounded-md capitalize motion-safe:transition',
                  active
                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100',
                )}
              >
                {d || 'Any'}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader>Price</SectionHeader>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800">
          {(['all', 'free', 'paid'] as const).map((p) => {
            const active = value.price === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => set('price', p)}
                className={cn(
                  'text-xs font-medium px-2 py-1.5 rounded-md capitalize motion-safe:transition',
                  active
                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100',
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
