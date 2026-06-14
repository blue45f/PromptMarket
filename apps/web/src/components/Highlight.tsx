import { useMemo, type ReactNode } from 'react'

interface HighlightProps {
  text: string
  query: string
  /** Optional className for the matched <mark>. */
  className?: string
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Renders `text` with every case-insensitive occurrence of `query` wrapped in
 * a <mark>. Tokenizes the query on whitespace so multi-term searches still
 * land each word. Returns the original text untouched when query is empty.
 */
export default function Highlight({ text, query, className }: HighlightProps) {
  const parts = useMemo<ReactNode[]>(() => {
    if (!query.trim() || !text) return [text]
    const tokens = Array.from(
      new Set(
        query
          .trim()
          .split(/\s+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 1)
      )
    )
    if (tokens.length === 0) return [text]
    const re = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi')
    const split = text.split(re)
    return split.map((chunk, i) => {
      if (i % 2 === 1) {
        return (
          <mark
            key={i}
            className={
              className ??
              'bg-transparent text-ink dark:text-bone font-semibold border-b-2 border-volt-400 dark:border-volt-300/80 px-0.5'
            }
          >
            {chunk}
          </mark>
        )
      }
      return chunk
    })
  }, [text, query, className])

  return <>{parts}</>
}
