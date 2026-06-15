import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@utils/cn'
import { Check, Copy, Terminal } from 'lucide-react'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { ListingType } from '@promptmarket/shared'
import type { TFunction } from 'i18next'

/* ---------------------------------------------------------------------------
 * InstallPanel — Smithery-style "drop this into your editor" panel. The
 * snippets are intentionally short and copy-pasteable: a CLI command when one
 * exists, otherwise a minimal config or file-placement instruction.
 *
 * Snippets are derived locally from the listing slug + type so the API
 * contract stays unchanged. Authors that want richer install instructions
 * can put them in the listing body.
 * ------------------------------------------------------------------------- */

interface InstallPanelProps {
  slug: string
  type: ListingType
  /** Optional class name on the outer card. */
  className?: string
}

type Target = {
  id: string
  label: string
  hint: string
  command: string
  /** Whether this target is meaningful for the given listing type. */
  fits: (t: ListingType) => boolean
}

function commands(slug: string, t: TFunction<'detail'>): Record<string, Target> {
  return {
    claudeCode: {
      id: 'claude-code',
      label: 'Claude Code',
      hint: 'CLI',
      command: `claude /install ${slug}`,
      fits: (t) =>
        t === 'SKILL' ||
        t === 'SLASH_COMMAND' ||
        t === 'SUBAGENT' ||
        t === 'CLAUDE_MD' ||
        t === 'AGENT_MD' ||
        t === 'PROMPT',
    },
    cursor: {
      id: 'cursor',
      label: 'Cursor',
      hint: '.cursorrules',
      command: `npx promptmarket fetch ${slug} --target cursor`,
      fits: (t) => t === 'CURSOR_RULES' || t === 'AGENT_MD' || t === 'PROMPT',
    },
    windsurf: {
      id: 'windsurf',
      label: 'Windsurf',
      hint: '.windsurfrules',
      command: `npx promptmarket fetch ${slug} --target windsurf`,
      fits: (t) => t === 'CURSOR_RULES' || t === 'AGENT_MD',
    },
    mcp: {
      id: 'mcp',
      label: t('install.targets.mcpClient'),
      hint: 'JSON config',
      command: `{\n  "mcpServers": {\n    "${slug}": {\n      "command": "npx",\n      "args": ["@promptmarket/mcp", "${slug}"]\n    }\n  }\n}`,
      fits: (t) => t === 'MCP_SERVER',
    },
    curl: {
      id: 'curl',
      label: 'cURL',
      hint: t('install.targets.curlHint'),
      command: `curl -sSL ${globalThis.location.origin}/api/listings/${slug}/raw -o ${slug}.md`,
      fits: () => true,
    },
  }
}

export default function InstallPanel({ slug, type, className }: InstallPanelProps) {
  const { t } = useTranslation('detail')
  const all = useMemo(() => commands(slug, t), [slug, t])
  const targets = useMemo(() => Object.values(all).filter((tg) => tg.fits(type)), [all, type])

  const [current, setCurrent] = useState<string>(targets[0]?.id ?? 'curl')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const active = targets.find((t) => t.id === current) ?? targets[0]
  if (!active) return null

  async function copy() {
    if (!active) return
    try {
      await navigator.clipboard.writeText(active.command)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard denied — keep silent */
    }
  }

  return (
    <section
      aria-label={t('install.title')}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub',
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line dark:border-night-line">
        <div className="inline-flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex w-8 h-8 rounded-lg bg-ink text-volt-300 dark:bg-volt-300 dark:text-ink items-center justify-center"
          >
            <Terminal className="w-4 h-4" />
          </span>
          <div>
            <p className="font-display text-[1rem] font-semibold text-ink dark:text-bone leading-none tracking-tight">
              {t('install.title')}
            </p>
            <p className="mt-1 text-[0.72rem] font-mono uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute">
              {t('install.subtitle')}
            </p>
          </div>
        </div>
      </header>

      <Tabs.Root value={current} onValueChange={setCurrent}>
        <Tabs.List
          className="flex gap-1 overflow-x-auto scrollbar-hide px-3 pt-3"
          aria-label={t('install.tabsAria')}
        >
          {targets.map((tg) => (
            <Tabs.Trigger
              key={tg.id}
              value={tg.id}
              className={cn(
                'group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap',
                'text-[0.78rem] font-medium motion-safe:transition-colors ease-expo focus-volt',
                'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone',
                'data-[state=active]:bg-ink data-[state=active]:text-bone',
                'dark:data-[state=active]:bg-bone dark:data-[state=active]:text-ink'
              )}
            >
              {tg.label}
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] opacity-70">
                {tg.hint}
              </span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {targets.map((tg) => (
          <Tabs.Content key={tg.id} value={tg.id} className="p-3">
            <div className="relative">
              <pre
                className="rounded-xl bg-ink text-bone p-4 pr-12 font-mono text-[0.82rem] leading-[1.6] overflow-x-auto"
                aria-label={t('install.commandAria', { label: tg.label })}
              >
                <code>{tg.command}</code>
              </pre>
              <button
                type="button"
                onClick={copy}
                aria-label={t('install.copyCommand')}
                className={cn(
                  'absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-mono uppercase tracking-[0.12em] motion-safe:transition ease-expo focus-volt',
                  copied ? 'bg-volt-300 text-ink' : 'bg-bone/10 text-bone hover:bg-bone/20'
                )}
              >
                {copied ? (
                  <Check aria-hidden className="w-3.5 h-3.5" />
                ) : (
                  <Copy aria-hidden className="w-3.5 h-3.5" />
                )}
                {copied ? t('install.copied') : t('install.copy')}
              </button>
              <span className="sr-only" role="status" aria-live="polite">
                {copied ? t('install.copied') : ''}
              </span>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <footer className="px-4 py-3 border-t border-line dark:border-night-line text-[0.72rem] text-ink-mute dark:text-bone-mute">
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-volt-700 dark:text-volt-300 mr-2">
            {t('install.tipLabel')}
          </span>
          {t('install.tip')}
        </p>
      </footer>
    </section>
  )
}
