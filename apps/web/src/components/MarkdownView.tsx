import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@utils/cn';

interface MarkdownViewProps {
  source: string;
  className?: string;
}

export default function MarkdownView({ source, className }: MarkdownViewProps) {
  return (
    <div
      className={cn(
        'prose prose-sm sm:prose-base dark:prose-invert max-w-none',
        'prose-headings:tracking-tight prose-p:leading-relaxed',
        'prose-a:text-indigo-600 dark:prose-a:text-indigo-400',
        'prose-pre:bg-zinc-900 prose-pre:text-zinc-100',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
