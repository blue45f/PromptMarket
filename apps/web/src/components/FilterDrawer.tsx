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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 w-80 max-w-[88vw] bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
            <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-zinc-100">
              Filters
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close filters"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FilterPanel value={value} onChange={onChange} onReset={onReset} />
          </div>
          <div className="border-t border-gray-200 dark:border-zinc-800 p-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full inline-flex justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] motion-safe:transition"
            >
              Apply filters
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
