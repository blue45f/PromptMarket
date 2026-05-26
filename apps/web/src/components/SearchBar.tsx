import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@utils/cn';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  className?: string;
}

export default function SearchBar({
  initialValue = '',
  placeholder = 'Search prompts, agents, skills…',
  onSubmit,
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <Search
        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none"
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'w-full pl-9 pr-3 py-2 rounded-lg text-sm',
          'border border-gray-200 dark:border-zinc-700',
          'bg-white dark:bg-zinc-900',
          'text-gray-900 dark:text-zinc-100',
          'placeholder:text-gray-400 dark:placeholder:text-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
        )}
      />
    </form>
  );
}
