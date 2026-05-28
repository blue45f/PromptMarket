import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import FilterPanel, { type FilterState } from './FilterPanel';

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

export default function FilterDrawer({
  open,
  onOpenChange,
  value,
  onChange,
  onReset,
}: FilterDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 w-80 max-w-[88vw] bg-canvas dark:bg-night border-r border-line dark:border-night-line shadow-xl shadow-ink/30 flex flex-col"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between p-4 border-b border-line dark:border-night-line">
            <Dialog.Title className="font-display text-[1rem] font-semibold text-ink dark:text-bone tracking-tight">
              필터
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="필터 닫기"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub motion-safe:transition focus-volt"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FilterPanel value={value} onChange={onChange} onReset={onReset} />
          </div>
          <div className="border-t border-line dark:border-night-line p-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="group relative overflow-hidden w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink text-sm font-medium tracking-tight motion-safe:transition focus-volt"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
              />
              <span className="relative group-hover:text-ink motion-safe:transition-colors">
                필터 적용
              </span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
