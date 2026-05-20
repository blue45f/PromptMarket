import { Bot, FileText, Sparkles } from 'lucide-react';
import type { ListingType } from '../lib/types';
import { typeColor, typeLabel } from '../lib/format';
import { cn } from '../lib/cn';

interface TypeBadgeProps {
  type: ListingType;
  className?: string;
}

const Icon = {
  PROMPT: Sparkles,
  CLAUDE_MD: FileText,
  AGENT_MD: Bot,
} as const;

export default function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  const I = Icon[type] ?? Sparkles;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        typeColor(type),
        className,
      )}
    >
      <I className="w-3 h-3" />
      {typeLabel(type)}
    </span>
  );
}
