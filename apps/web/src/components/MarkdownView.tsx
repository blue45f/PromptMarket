import { cn } from '@utils/cn'
import { Check, Copy } from 'lucide-react'
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
  type UrlTransform,
} from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { copyToClipboard } from '@/lib/share'

const REMARK_PLUGINS = [remarkGfm]
const MARKDOWN_COMPONENTS: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  a: ({ node: _node, href, children, ...props }) => {
    const external = isExternalHref(href)
    return (
      <a
        {...props}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    )
  },
}
const SAFE_RELATIVE_PREFIXES = ['/', './', '../', '#']

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )
  async function copy() {
    const text = extractText(children).replace(/\n$/, '')
    if (!text) return
    // copyToClipboard adds a legacy execCommand fallback so copying a code block
    // still works in insecure/preview contexts without navigator.clipboard.
    if (await copyToClipboard(text)) {
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 1500)
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
          'motion-safe:transition ease-expo focus-volt',
          copied
            ? 'bg-volt-300 text-ink'
            : 'bg-bone/10 text-bone hover:bg-bone/20 opacity-0 group-hover:opacity-100 motion-safe:duration-200'
        )}
      >
        {copied ? (
          <Check aria-hidden className="w-3 h-3" />
        ) : (
          <Copy aria-hidden className="w-3 h-3" />
        )}
        {copied ? t('markdown.copied') : t('markdown.copy')}
      </button>
    </div>
  )
}

function isExternalHref(href: string | undefined): boolean {
  return !!href && /^(?:https?:)?\/\//i.test(href)
}

const safeMarkdownUrl: UrlTransform = (url, key, node) => {
  const transformed = defaultUrlTransform(url)
  if (!transformed) return ''
  if (key !== 'href' && key !== 'src') return transformed

  try {
    const parsed = new URL(transformed, 'https://promptmarket.local')
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return transformed
    if (key === 'href' && (parsed.protocol === 'mailto:' || parsed.protocol === 'tel:')) {
      return transformed
    }
  } catch {
    if (SAFE_RELATIVE_PREFIXES.some((prefix) => transformed.startsWith(prefix))) {
      return transformed
    }
  }

  if (
    node.tagName === 'a' &&
    SAFE_RELATIVE_PREFIXES.some((prefix) => transformed.startsWith(prefix))
  ) {
    return transformed
  }
  return ''
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
        skipHtml
        urlTransform={safeMarkdownUrl}
        components={MARKDOWN_COMPONENTS}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
