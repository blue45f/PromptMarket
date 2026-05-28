import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { useListings } from '@features/marketplace/queries';
import { LISTING_TYPE_META } from '@promptmarket/shared';
import { formatPrice } from '@utils/format';
import { cn } from '@utils/cn';
import { useSpotlight } from '@hooks/useSpotlight';
import StatsStrip from './StatsStrip';

/* ---------------------------------------------------------------------------
 * Hero — editorial asymmetric layout with kinetic typography, cursor-followed
 * spotlight, and a live "drops" marquee. The headline reveals letter-by-letter
 * via the .letter-in animation in index.css.
 * ------------------------------------------------------------------------- */

const HEADLINE_TOKENS: Array<{
  text: string;
  size: 'condense' | 'tight' | 'wide';
  highlight?: boolean;
}> = [
  { text: '검증된', size: 'condense' },
  { text: '프롬프트,', size: 'tight' },
  { text: '스킬', size: 'tight', highlight: true },
  { text: '그리고', size: 'wide' },
  { text: '에이전트.', size: 'wide' },
];

export default function Hero() {
  const recentQ = useListings({ sort: 'newest', pageSize: 10 });
  const drops = recentQ.data?.items ?? [];
  const spotlightRef = useSpotlight<HTMLDivElement>();

  return (
    <section
      ref={spotlightRef}
      className="spotlight-host relative overflow-hidden isolate"
    >
      {/* Cursor-following lime spotlight, behind everything else */}
      <div className="spotlight -z-10" aria-hidden />

      {/* Ambient mesh — lime, violet, coral orbs */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <div className="absolute top-[-22%] left-[-12%] w-[55%] h-[60%] rounded-full bg-volt-200/60 dark:bg-volt-600/25 blur-3xl orb-drift" />
        <div
          className="absolute top-[8%] right-[-18%] w-[55%] h-[58%] rounded-full bg-violet/30 dark:bg-violet/35 blur-3xl orb-drift"
          style={{ animationDelay: '-5s' }}
        />
        <div
          className="absolute bottom-[-30%] left-[28%] w-[55%] h-[55%] rounded-full bg-coral/25 dark:bg-coral/30 blur-3xl orb-drift"
          style={{ animationDelay: '-9s' }}
        />
      </div>
      <div className="grain-layer" aria-hidden />

      <div className="relative mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(2.5rem,7vw,6rem)] pb-[clamp(3rem,8vw,7rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-[clamp(2rem,5vw,3.5rem)] lg:gap-x-[clamp(1.5rem,3vw,3rem)]">
          {/* Headline column */}
          <div className="lg:col-span-8 xl:col-span-8 min-w-0">
            <div className="flex items-center gap-3 mb-5 animate-fade-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[0.7rem] font-mono uppercase tracking-[0.16em] surface-glass border border-line-strong dark:border-night-line text-ink-soft dark:text-bone-soft">
                <span className="relative inline-flex w-2 h-2 rounded-full bg-volt-500 volt-pulse" />
                Live · MMVI · 앤솔로지 vol.01
              </span>
              <RotatingPhrase
                phrases={['실전 검증', '에이전트 시대', '빌더의 선반', '오픈 카탈로그']}
              />
            </div>

            <KineticHeadline />

            <p
              className="mt-7 max-w-[40ch] text-ink-soft dark:text-bone-soft leading-[1.55] animate-fade-up stagger-3"
              style={{ fontSize: 'var(--text-lead)' }}
            >
              Claude, GPT-5, Gemini로 프로덕션을 굽고 있는 빌더들이 만든 컬렉션.
              둘러보고, 구매하고, 리믹스하세요. 에이전트 시대를 진지하게 다루는 카탈로그입니다.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up stagger-4">
              <Link
                to="/browse"
                className="group relative inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight lift-on-hover focus-volt overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
                />
                <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors motion-safe:duration-300">
                  카탈로그 둘러보기
                  <ArrowRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
                </span>
              </Link>
              <Link
                to="/sell"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-ink/15 dark:border-bone/20 text-ink dark:text-bone font-medium tracking-tight hover:border-ink dark:hover:border-bone hover:bg-canvas-deep/60 dark:hover:bg-night-sub focus-volt motion-safe:transition"
              >
                <Compass className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:-rotate-12" />
                프롬프트 판매하기
              </Link>
              <span className="hidden sm:inline-flex items-center gap-2 ml-2 text-meta text-ink-mute dark:text-bone-mute font-mono">
                <span aria-hidden>↓</span> 프론티어 모델 21종 · 아티팩트 8종
              </span>
            </div>

            {/* Tagline strip — mini-marquee that tilts in the brand's tech voice */}
            <div className="mt-12 -mx-[clamp(1.25rem,4vw,3rem)] overflow-hidden animate-fade-up stagger-5">
              <div className="flex items-center gap-10 marquee-track whitespace-nowrap py-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                {[
                  ...['◆ prompts', 'claude.md', 'agent.md', 'skills', 'mcp', 'slash cmds', 'sub-agents', '.cursorrules', '◆ 에이전틱', '카탈로그'],
                  ...['◆ prompts', 'claude.md', 'agent.md', 'skills', 'mcp', 'slash cmds', 'sub-agents', '.cursorrules', '◆ 에이전틱', '카탈로그'],
                ].map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-10">
                    {t}
                    <span aria-hidden className="w-1 h-1 rounded-full bg-volt-500/60" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Live drops marquee — right column */}
          <aside className="lg:col-span-4 xl:col-span-4 relative min-w-0 animate-fade-up stagger-3">
            <DropsMarquee items={drops} loading={recentQ.isPending} />
          </aside>
        </div>

        {/* StatsStrip — kept, but visually realigned to support the headline */}
        <div className="mt-[clamp(3rem,7vw,5rem)] animate-fade-up stagger-5">
          <StatsStrip />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Kinetic headline — each word animates in via .letter-in with staggered
 * indices. The "스킬" word gets a lime highlight that draws after the word
 * itself lands.
 * ------------------------------------------------------------------------- */

function KineticHeadline() {
  return (
    <h1
      className="font-display text-ink dark:text-bone leading-[0.88] tracking-[-0.045em]"
      style={{ fontSize: 'var(--text-display-xl)' }}
    >
      {HEADLINE_TOKENS.map((tok, i) => {
        const sizeClass =
          tok.size === 'condense' ? 'display-condense' : tok.size === 'tight' ? 'display-tight' : 'display-wide';
        const isFirstInLine =
          i === 0 || i === 1 || i === 3 || (i === 4 && tok.size === 'wide' && HEADLINE_TOKENS[3]?.size !== 'wide');
        // Place "스킬" inline after "프롬프트,"; "그리고" + "에이전트." on their own lines.
        return (
          <span
            key={tok.text + i}
            className={cn(
              sizeClass,
              tok.highlight && 'relative inline-block',
              isFirstInLine && 'block',
              !isFirstInLine && i === 2 && 'inline-block ml-[0.25em]',
              !isFirstInLine && i !== 2 && 'inline-block',
            )}
            style={
              {
                animationDelay: `${i * 90}ms`,
              } as React.CSSProperties
            }
          >
            {tok.highlight ? (
              <>
                <span className="relative z-10 letter-in" style={{ '--i': i } as React.CSSProperties}>
                  {tok.text}
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-[0.14em] h-[0.42em] bg-volt-300 dark:bg-volt-500/80 -z-0 -skew-x-6 origin-left motion-safe:[animation:letterIn_0.9s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${(i + 1) * 90}ms` } as React.CSSProperties}
                />
              </>
            ) : (
              <span className="letter-in inline-block" style={{ '--i': i } as React.CSSProperties}>
                {tok.text}
              </span>
            )}
          </span>
        );
      })}
    </h1>
  );
}

/* ---------------------------------------------------------------------------
 * Rotating phrase — a small kicker beside the live badge that cycles through
 * a few brand phrases. Subtle but adds a sense of life to the kicker.
 * ------------------------------------------------------------------------- */

function RotatingPhrase({ phrases }: { phrases: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % phrases.length), 2600);
    return () => clearInterval(id);
  }, [phrases.length]);
  return (
    <span
      aria-live="polite"
      className="hidden md:inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute"
    >
      <span aria-hidden className="w-3 h-px bg-ink-mute dark:bg-bone-mute" />
      <span
        key={idx}
        className="inline-block motion-safe:[animation:fadeUp_0.6s_cubic-bezier(0.22,1,0.36,1)_both]"
      >
        {phrases[idx]}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------------- */

interface DropsMarqueeProps {
  items: Array<{
    id: string;
    slug: string;
    title: string;
    type: keyof typeof LISTING_TYPE_META;
    priceCents: number | null | undefined;
    coverEmoji?: string | null;
    author?: { username?: string | null } | null;
  }>;
  loading?: boolean;
}

function DropsMarquee({ items, loading }: DropsMarqueeProps) {
  const seed: DropsMarqueeProps['items'] = items.length
    ? items
    : Array.from({ length: 6 }).map((_, i) => ({
        id: `seed-${i}`,
        slug: `seed-${i}`,
        title: ['시니어 코드 리뷰어', '데이터 분석 서브에이전트', 'MCP 파일시스템', '모노레포 CLAUDE.md', '이미지 생성 아트 디렉터', 'Cursor Swift 룰'][i],
        type: ['SUBAGENT', 'AGENT_MD', 'MCP_SERVER', 'CLAUDE_MD', 'PROMPT', 'CURSOR_RULES'][i] as keyof typeof LISTING_TYPE_META,
        priceCents: [499, 0, 0, 299, 1299, 0][i],
        coverEmoji: ['🧑‍⚖️', '📊', '🗂️', '📘', '🎨', '🦅'][i],
        author: { username: ['alex', 'mira', 'kenji', 'lou', 'pia', 'rin'][i] },
      }));
  const doubled = [...seed, ...seed];

  return (
    <div
      className="relative rounded-3xl overflow-hidden surface-card lift-on-hover spotlight-host"
      style={{ height: 'clamp(22rem, 56vh, 34rem)' }}
    >
      {/* Inner spotlight (different hue) */}
      <div className="spotlight" aria-hidden style={{ ['--spot-color' as string]: 'oklch(0.66 0.24 305 / 0.25)' }} />

      {/* Top + bottom fade */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-canvas-sub dark:from-night-sub to-transparent z-10 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-canvas-sub dark:from-night-sub to-transparent z-10 pointer-events-none"
      />

      {/* Header label */}
      <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between text-[0.66rem] font-mono uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-volt-500 volt-pulse" />
          새 드롭
        </span>
        <span>{loading ? '동기화 중…' : 'live'}</span>
      </div>

      {/* Vertical marquee */}
      <div className="absolute inset-0 pt-12 pb-6">
        <ul className="v-marquee-track flex flex-col gap-2.5">
          {doubled.map((drop, idx) => (
            <DropRow key={`${drop.id}-${idx}`} drop={drop} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function DropRow({ drop }: { drop: DropsMarqueeProps['items'][number] }) {
  const meta = LISTING_TYPE_META[drop.type];
  const free = (drop.priceCents ?? 0) === 0;
  return (
    <li className="mx-3.5">
      <Link
        to={`/listings/${drop.slug}`}
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-line/60 dark:border-night-line/60 bg-canvas/70 dark:bg-night/40 hover:bg-canvas-deep/80 dark:hover:bg-night-deep/80 hover:border-volt-300 dark:hover:border-volt-500/50 motion-safe:transition-colors"
      >
        <span
          aria-hidden
          className={cn(
            'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br motion-safe:transition-transform motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6',
            meta.gradient,
          )}
        >
          {drop.coverEmoji || meta.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink dark:text-bone truncate leading-tight">
            {drop.title}
          </p>
          <p className="mt-0.5 text-[0.66rem] font-mono uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute truncate">
            {meta.label.toLowerCase()}
            {drop.author?.username && ` · @${drop.author.username}`}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 text-[0.68rem] font-mono px-2 py-0.5 rounded-full',
            free
              ? 'bg-volt-300 text-ink'
              : 'bg-ink text-bone dark:bg-bone dark:text-ink',
          )}
        >
          {formatPrice(drop.priceCents ?? 0)}
        </span>
      </Link>
    </li>
  );
}
