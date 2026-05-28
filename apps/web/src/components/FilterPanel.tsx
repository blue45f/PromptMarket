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

const DIFFICULTY_LABEL: Record<'' | Difficulty, string> = {
  '': '전체',
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

const PRICE_LABEL: Record<'all' | 'free' | 'paid', string> = {
  all: '전체',
  free: '무료',
  paid: '유료',
};

function SectionHeader({ children }: { children: string }) {
  return (
    <h4 className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute mb-2.5 inline-flex items-center gap-2">
      <span aria-hidden className="w-3 h-px bg-volt-500/70" />
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
        <p className="font-display text-[0.95rem] font-semibold text-ink dark:text-bone tracking-tight">
          필터
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-[0.78rem] font-medium text-volt-700 dark:text-volt-300 hover:underline underline-offset-[3px] focus-volt rounded"
        >
          전부 초기화
        </button>
      </div>

      <section>
        <SectionHeader>타입</SectionHeader>
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
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.72rem] font-medium border motion-safe:transition focus-volt',
                  active
                    ? 'bg-volt-100 dark:bg-volt-900/40 text-volt-800 dark:text-volt-200 border-volt-300 dark:border-volt-700'
                    : 'bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft border-line dark:border-night-line hover:border-volt-400 dark:hover:border-volt-500/50',
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
        <SectionHeader>모델</SectionHeader>
        <ModelPicker
          value={value.models}
          onChange={(next) => set('models', next)}
        />
      </section>

      {showTechnique && (
        <section>
          <SectionHeader>프롬프트 기법</SectionHeader>
          <div className="space-y-1">
            <label className="flex items-center gap-2.5 text-[0.86rem] cursor-pointer">
              <input
                type="radio"
                checked={value.technique === ''}
                onChange={() => set('technique', '')}
                className="accent-volt-500"
              />
              <span className="text-ink-soft dark:text-bone-soft">전체</span>
            </label>
            {ALL_TECHNIQUES.map((tk) => (
              <label key={tk} className="flex items-center gap-2.5 text-[0.86rem] cursor-pointer">
                <input
                  type="radio"
                  checked={value.technique === tk}
                  onChange={() => set('technique', tk)}
                  className="accent-volt-500"
                />
                <span className="text-ink-soft dark:text-bone-soft">
                  {TECHNIQUE_META[tk].label}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader>카테고리</SectionHeader>
        <div className="grid grid-cols-2 gap-1">
          {CATEGORIES.map((c) => {
            const active = value.category === c;
            return (
              <label
                key={c}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg text-[0.82rem] cursor-pointer motion-safe:transition',
                  active
                    ? 'bg-volt-100 dark:bg-volt-900/40 text-volt-800 dark:text-volt-200'
                    : 'text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-deep',
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => set('category', active ? '' : c)}
                  className="accent-volt-500"
                />
                <span className="truncate">{c}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader>난이도</SectionHeader>
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-canvas-deep dark:bg-night-deep border border-line dark:border-night-line">
          {(['', ...DIFFICULTIES] as const).map((d) => {
            const active = value.difficulty === d;
            return (
              <button
                key={d || 'all'}
                type="button"
                onClick={() => set('difficulty', d as FilterState['difficulty'])}
                className={cn(
                  'text-[0.74rem] font-medium px-1 py-1.5 rounded-lg motion-safe:transition focus-volt',
                  active
                    ? 'bg-canvas dark:bg-night text-ink dark:text-bone shadow-[0_4px_12px_-6px_oklch(0.16_0.03_290_/_0.4)]'
                    : 'text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone',
                )}
              >
                {DIFFICULTY_LABEL[d as '' | Difficulty]}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader>가격</SectionHeader>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-canvas-deep dark:bg-night-deep border border-line dark:border-night-line">
          {(['all', 'free', 'paid'] as const).map((p) => {
            const active = value.price === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => set('price', p)}
                className={cn(
                  'text-[0.74rem] font-medium px-2 py-1.5 rounded-lg motion-safe:transition focus-volt',
                  active
                    ? 'bg-canvas dark:bg-night text-ink dark:text-bone shadow-[0_4px_12px_-6px_oklch(0.16_0.03_290_/_0.4)]'
                    : 'text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone',
                )}
              >
                {PRICE_LABEL[p]}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
