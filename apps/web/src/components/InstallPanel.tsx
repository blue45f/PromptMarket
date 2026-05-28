import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Check, Copy, Terminal } from 'lucide-react';
import type { ListingType } from '@promptmarket/shared';
import { cn } from '@utils/cn';

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
  slug: string;
  type: ListingType;
  /** Optional class name on the outer card. */
  className?: string;
}

type Target = {
  id: string;
  label: string;
  hint: string;
  command: string;
  /** Whether this target is meaningful for the given listing type. */
  fits: (t: ListingType) => boolean;
};

function commands(slug: string): Record<string, Target> {
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
      label: 'MCP 클라이언트',
      hint: 'JSON config',
      command: `{\n  "mcpServers": {\n    "${slug}": {\n      "command": "npx",\n      "args": ["@promptmarket/mcp", "${slug}"]\n    }\n  }\n}`,
      fits: (t) => t === 'MCP_SERVER',
    },
    curl: {
      id: 'curl',
      label: 'cURL',
      hint: '리스팅 본문 받기',
      command: `curl -sSL https://promptmarket.dev/api/listings/${slug}/raw -o ${slug}.md`,
      fits: () => true,
    },
  };
}

export default function InstallPanel({ slug, type, className }: InstallPanelProps) {
  const all = useMemo(() => commands(slug), [slug]);
  const targets = useMemo(() => Object.values(all).filter((t) => t.fits(type)), [all, type]);

  const [current, setCurrent] = useState<string>(targets[0]?.id ?? 'curl');
  const [copied, setCopied] = useState(false);

  const active = targets.find((t) => t.id === current) ?? targets[0];
  if (!active) return null;

  async function copy() {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard denied — keep silent */
    }
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub',
        className,
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
              에디터로 가져오기
            </p>
            <p className="mt-1 text-[0.72rem] font-mono uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute">
              원하는 도구 선택 → 복사 → 붙여넣기
            </p>
          </div>
        </div>
      </header>

      <Tabs.Root value={current} onValueChange={setCurrent}>
        <Tabs.List
          className="flex gap-1 overflow-x-auto scrollbar-hide px-3 pt-3"
          aria-label="설치 대상"
        >
          {targets.map((t) => (
            <Tabs.Trigger
              key={t.id}
              value={t.id}
              className={cn(
                'group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap',
                'text-[0.78rem] font-medium motion-safe:transition-colors focus-volt',
                'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone',
                'data-[state=active]:bg-ink data-[state=active]:text-bone',
                'dark:data-[state=active]:bg-bone dark:data-[state=active]:text-ink',
              )}
            >
              {t.label}
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] opacity-70">
                {t.hint}
              </span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {targets.map((t) => (
          <Tabs.Content key={t.id} value={t.id} className="p-3">
            <div className="relative">
              <pre
                className="rounded-xl bg-ink text-bone p-4 pr-12 font-mono text-[0.82rem] leading-[1.6] overflow-x-auto"
                tabIndex={0}
                aria-label={`${t.label} 명령`}
              >
                <code>{t.command}</code>
              </pre>
              <button
                type="button"
                onClick={copy}
                aria-label="명령 복사"
                className={cn(
                  'absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-mono uppercase tracking-[0.12em] motion-safe:transition focus-volt',
                  copied
                    ? 'bg-volt-300 text-ink'
                    : 'bg-bone/10 text-bone hover:bg-bone/20',
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <footer className="px-4 py-3 border-t border-line dark:border-night-line text-[0.72rem] text-ink-mute dark:text-bone-mute">
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-volt-700 dark:text-volt-300 mr-2">팁</span>
          구매 후 본문이 잠금 해제됩니다. CLI는 구매 토큰을 자동으로 사용해요.
        </p>
      </footer>
    </section>
  );
}
