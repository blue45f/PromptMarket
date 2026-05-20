import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  source: string;
  className?: string;
}

export default function MarkdownView({ source, className = '' }: MarkdownViewProps) {
  return (
    <div className={`prose-md max-w-none text-gray-800 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
