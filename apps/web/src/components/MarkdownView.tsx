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
        'prose-headings:tracking-tight prose-headings:font-display',
        'prose-p:leading-relaxed prose-li:leading-relaxed',
        'prose-a:text-volt-800 dark:prose-a:text-volt-300 prose-a:underline-offset-4',
        'prose-strong:text-ink dark:prose-strong:text-bone',
        'prose-pre:bg-ink prose-pre:text-bone prose-pre:border prose-pre:border-night-line',
        'prose-code:before:hidden prose-code:after:hidden',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
