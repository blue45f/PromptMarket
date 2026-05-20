import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  className?: string;
}

export default function SearchBar({
  initialValue = '',
  placeholder = 'Search prompts, agents…',
  onSubmit,
  className = '',
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
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </form>
  );
}
