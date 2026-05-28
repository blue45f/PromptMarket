import { useEffect, useMemo, useState } from 'react';
import { cn } from '@utils/cn';

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

interface MarkdownTocProps {
  /** Raw markdown source — parsed for ATX headings only. */
  source: string;
  className?: string;
  /** When set, scrolls past a sticky header / navbar. Defaults to 96px. */
  scrollOffsetPx?: number;
}

/* ---------------------------------------------------------------------------
 * MarkdownToc — extracts H2/H3 headings from a markdown source, slugs the
 * text, and renders an inline rail. The headings inside MarkdownView pick
 * up the same slug ids via the rehype defaults (id attributes derived from
 * heading text), so anchor clicks land on the right block.
 *
 * Active-section tracking uses IntersectionObserver against the document
 * headings rather than maintaining a parallel state, so the highlight
 * reflects whatever's actually rendered.
 * ------------------------------------------------------------------------- */

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ㄱ-힝\s-]/giu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseHeadings(md: string): TocEntry[] {
  if (!md) return [];
  const lines = md.split('\n');
  const out: TocEntry[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(##|###)\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].replace(/[*_`]/g, '').trim();
    if (!text) continue;
    const id = slug(text) || `h${out.length}`;
    out.push({ id, text, level });
  }
  return out;
}

export default function MarkdownToc({
  source,
  className,
  scrollOffsetPx = 96,
}: MarkdownTocProps) {
  const entries = useMemo(() => parseHeadings(source), [source]);
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    if (entries.length === 0) return;
    // The headings inside react-markdown don't auto-receive ids, so we
    // assign them on mount by matching slugs against the heading text.
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>('.prose h2, .prose h3'),
    );
    for (const h of headings) {
      const id = slug(h.textContent ?? '');
      if (id && !h.id) h.id = id;
    }

    const obs = new IntersectionObserver(
      (intersecting) => {
        const visible = intersecting
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: `-${scrollOffsetPx}px 0px -60% 0px`, threshold: 0 },
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [entries, scrollOffsetPx]);

  function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - scrollOffsetPx;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setActive(id);
  }

  if (entries.length < 2) return null;

  return (
    <aside
      aria-label="목차"
      className={cn(
        'relative rounded-2xl border border-line dark:border-night-line bg-canvas-sub/70 dark:bg-night-sub/70 p-5 backdrop-blur-sm',
        className,
      )}
    >
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2 mb-3.5">
        <span aria-hidden className="w-5 h-px bg-volt-500" />
        목차
      </p>
      <ol className="space-y-1.5">
        {entries.map((e) => {
          const isActive = active === e.id;
          return (
            <li key={e.id} className={e.level === 3 ? 'pl-3' : ''}>
              <a
                href={`#${e.id}`}
                onClick={(ev) => jump(ev, e.id)}
                className={cn(
                  'block py-1 text-[0.83rem] leading-snug motion-safe:transition-colors focus-volt rounded',
                  isActive
                    ? 'text-ink dark:text-bone font-semibold'
                    : 'text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone',
                  e.level === 3 && 'text-[0.78rem]',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'inline-block w-1 h-1 rounded-full mr-2 align-middle motion-safe:transition',
                    isActive ? 'bg-volt-500 scale-150' : 'bg-line dark:bg-night-line',
                  )}
                />
                {e.text}
              </a>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
