import { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const REMARK_PLUGINS = [remarkGfm]
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import { cn } from '@utils/cn'

interface MarkdownViewProps {
  source: string
  className?: string
}

/* ---------------------------------------------------------------------------
 * MarkdownView — renders the listing body and gives every `<pre>` block a
 * floating copy button so visitors can grab a single snippet without
 * scrolling the entire page or copying the whole body.
 * ------------------------------------------------------------------------- */

function extractText(node: ReactNode): string {
  if (node == null) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    return extractText(props?.children)
  }
  return ''
}

function CodeBlock({ children }: { children: ReactNode }) {
  const { t } = useTranslation('detail')
  const [copied, setCopied] = useState(false)
  async function copy() {
    const text = extractText(children).replace(/\n$/, '')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard denied — silently ignore */
    }
  }
  return (
    <div className="not-prose group relative my-4">
      <pre className="rounded-xl bg-ink text-bone border border-night-line p-4 pr-14 overflow-x-auto text-[0.86rem] leading-[1.6] font-mono">
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={t('markdown.copyCodeBlock')}
        className={cn(
          'absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[0.65rem] font-mono uppercase tracking-[0.14em]',
          'motion-safe:transition focus-volt',
          copied
            ? 'bg-volt-300 text-ink'
            : 'bg-bone/10 text-bone hover:bg-bone/20 opacity-0 group-hover:opacity-100 motion-safe:duration-200'
        )}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? t('markdown.copied') : t('markdown.copy')}
      </button>
    </div>
  )
}

export default function MarkdownView({ source, className }: MarkdownViewProps) {
  return (
    <div
      className={cn(
        'prose prose-sm sm:prose-base dark:prose-invert max-w-none',
        'prose-headings:tracking-tight prose-headings:font-display',
        'prose-p:leading-relaxed prose-p:max-w-[72ch] prose-li:leading-relaxed prose-li:max-w-[72ch]',
        'prose-a:text-volt-800 dark:prose-a:text-volt-300 prose-a:underline-offset-4',
        'prose-strong:text-ink dark:prose-strong:text-bone',
        'prose-code:before:hidden prose-code:after:hidden',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
