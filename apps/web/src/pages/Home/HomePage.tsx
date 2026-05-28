import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useListings } from '@features/marketplace/queries';
import { getErrorMessage } from '@services/api';
import { useReveal } from '@hooks/useReveal';
import { useSpotlight } from '@hooks/useSpotlight';
import { usePageMeta } from '@hooks/usePageMeta';
import { useStructuredData } from '@hooks/useStructuredData';
import { LISTING_TYPE_META } from '@promptmarket/shared';
import { typeGradient } from '@utils/format';
import { cn } from '@utils/cn';
import Hero from '@components/Hero';
import CategoryChips from '@components/CategoryChips';
import FeaturedCarousel from '@components/FeaturedCarousel';
import ListingCard from '@components/ListingCard';
import ModelTabs from '@components/ModelTabs';
import RecentlyViewed from '@components/RecentlyViewed';
import { SkeletonGrid } from '@components/SkeletonCard';
import SkeletonCard from '@components/SkeletonCard';
import EmptyState from '@components/EmptyState';

export default function HomePage() {
  const featuredQ = useListings({ sort: 'top', pageSize: 6 });
  const trendingQ = useListings({ sort: 'trending', pageSize: 8 });
  const recentQ = useListings({ sort: 'newest', pageSize: 8 });

  const featured = featuredQ.data?.items ?? [];
  const trending = trendingQ.data?.items ?? [];
  const recent = recentQ.data?.items ?? [];
  const error = trendingQ.error ?? recentQ.error ?? featuredQ.error;

  usePageMeta({
    title: 'PromptMarket — 검증된 AI 프롬프트, 스킬, 에이전트',
    description:
      'Claude, GPT-5, Gemini로 프로덕션을 굽고 있는 빌더들의 카탈로그. 프롬프트, CLAUDE.md, Claude Code 스킬, MCP 서버, 서브에이전트, .cursorrules를 사고팝니다.',
  });

  // WebSite + SearchAction so Google can render a sitelinks search box.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  useStructuredData(
    origin
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'PromptMarket',
          alternateName: '프롬프트마켓',
          url: origin,
          inLanguage: 'ko-KR',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${origin}/browse?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        }
      : null,
  );

  return (
    <div className="animate-fade-in">
      <ScrollProgress />
      <Hero />

      {/* Marquee strip — horizontal infinite-scrolling section anchor */}
      <MarqueeStrip />

      <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(3rem,6vw,5rem)] space-y-[clamp(3.5rem,7vw,7rem)]">
        {error && (
          <p className="text-coral-deep dark:text-coral text-sm font-mono">
            {getErrorMessage(error)}
          </p>
        )}

        {/* FEATURED — bento grid */}
        <section>
          <SectionHeader
            chapter="01 / 추천"
            title="엄선 드롭"
            kicker="이번 주 카탈로그의 표지."
            href="/browse?sort=top"
          />
          {featuredQ.isPending ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 auto-rows-[1fr]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}>
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : featured.length ? (
            <BentoFeatured items={featured} />
          ) : (
            <EmptyState
              emoji="✨"
              title="아직 추천 드롭이 없어요"
              description="조금만 기다려 주세요 — 에디터가 고르고 있어요."
            />
          )}
        </section>

        {/* CATEGORIES */}
        <section>
          <SectionHeader
            chapter="02 / 카탈로그"
            title="카테고리로 둘러보기"
            kicker="14개 분야, 한 책장."
          />
          <CategoryChips />
        </section>

        {/* TRENDING — large left + carousel right on desktop */}
        <section>
          <SectionHeader
            chapter="03 / 트렌딩"
            title="이번 주 뜨거워요"
            kicker="지난 7일간 다운로드 상위."
            href="/browse?sort=trending"
          />
          {trendingQ.isPending ? (
            <SkeletonGrid count={8} />
          ) : trending.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--space-gap-lg)]">
              {/* Lead: oversized — keeps presence on wide viewports, full-width on narrow */}
              <div className="lg:col-span-5 min-w-0">
                <ListingCard listing={trending[0]} variant="featured" />
              </div>
              {/* Grid of 6 — auto-fit so it reflows fluidly between 2 and 3 columns */}
              <div className="lg:col-span-7 min-w-0 cards-fluid">
                {trending.slice(1, 7).map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              emoji="🔥"
              title="아직 트렌딩 리스팅이 없어요"
              description="첫 번째 게시자가 되어 보세요."
            />
          )}
        </section>

        {/* RECENT — featured carousel keeps horizontal momentum */}
        <section>
          <SectionHeader
            chapter="04 / 신규"
            title="방금 작업장에서 나왔어요"
            kicker="최근 며칠 사이의 드롭. 가져다 쓰고, 포크하고, 리믹스하세요."
            href="/browse?sort=newest"
          />
          <FeaturedCarousel items={recent} loading={recentQ.isPending} />
        </section>

        {/* RECENTLY VIEWED — only renders when localStorage has entries */}
        <RecentlyViewed />

        {/* MAKER SPOTLIGHT */}
        <MakerSpotlight items={featured} />

        {/* MODEL TABS */}
        <section>
          <ModelTabs />
        </section>

        {/* CTA */}
        <SellerCallToAction />
      </div>
    </div>
  );
}

/* ---------- Scroll progress bar --------------------------------------- */

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max <= 0 ? 0 : h.scrollTop / max);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="scroll-progress" style={{ ['--progress' as string]: progress }} />;
}

/* ---------- Section primitives ----------------------------------------- */

function SectionHeader({
  chapter,
  title,
  kicker,
  href,
}: {
  chapter: string;
  title: string;
  kicker?: string;
  href?: string;
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className="reveal flex flex-col lg:flex-row lg:items-end justify-between gap-3 lg:gap-6 mb-7 lg:mb-9"
    >
      <div className="space-y-2">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-6 h-px bg-volt-500" />
          {chapter}
        </p>
        <h2
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.03em] display-tight"
          style={{ fontSize: 'var(--text-display-sm)' }}
        >
          {title}
        </h2>
        {kicker && (
          <p className="text-ink-mute dark:text-bone-mute text-[0.95rem] max-w-prose">{kicker}</p>
        )}
      </div>
      {href && (
        <Link
          to={href}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line dark:border-night-line bg-canvas/60 dark:bg-night-sub/40 hover:border-ink dark:hover:border-bone text-ink dark:text-bone text-[0.83rem] font-medium motion-safe:transition focus-volt shrink-0"
        >
          전체 보기
          <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
        </Link>
      )}
    </div>
  );
}

/* ---------- Maker Spotlight ------------------------------------------- */

function MakerSpotlight({ items }: { items: import('@/types').ListingCard[] }) {
  const spotlightRef = useSpotlight<HTMLDivElement>();
  const { ref, revealed } = useReveal<HTMLDivElement>();

  // Rotate the featured maker across distinct authors in the featured pool,
  // pinned per ~3-hour window so the same visitor sees the same spotlight
  // within a session but the home page feels alive across the day.
  const maker = useMemo(() => {
    const seen = new Set<string>();
    const candidates = items
      .filter((l) => {
        const u = l.author?.username;
        if (!u || seen.has(u)) return false;
        seen.add(u);
        return true;
      })
      .map((l) => l.author!.username!);
    if (candidates.length === 0) {
      return { username: 'mira', avatar: 'M', listings: [] as typeof items };
    }
    const slot = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
    const username = candidates[slot % candidates.length];
    const listings = items.filter((l) => l.author?.username === username).slice(0, 3);
    return {
      username,
      avatar: username[0]?.toUpperCase() ?? 'M',
      listings,
    };
  }, [items]);
  return (
    <section
      ref={ref}
      data-revealed={revealed}
      className="reveal relative"
    >
      <div
        ref={spotlightRef}
        className="spotlight-host relative overflow-hidden rounded-[2rem] surface-card border-line dark:border-night-line"
      >
        <div className="spotlight" aria-hidden style={{ ['--spot-color' as string]: 'oklch(0.83 0.23 124 / 0.22)' }} />
        <div className="cursor-sheen" aria-hidden />
        <div className="grain-layer" aria-hidden />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-10 p-[clamp(1.75rem,4vw,3.5rem)]">
          {/* Left: maker block */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
              <span aria-hidden className="w-6 h-px bg-volt-500" />
              SPOT / 이번 주의 메이커
            </p>
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className="relative inline-flex w-16 h-16 rounded-2xl bg-ink dark:bg-bone text-bone dark:text-ink font-display font-bold text-[1.7rem] items-center justify-center -rotate-3"
              >
                {maker.avatar}
                <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-volt-400 ring-2 ring-canvas-sub dark:ring-night-sub" />
              </span>
              <div>
                <p className="font-display text-[1.8rem] font-bold text-ink dark:text-bone leading-none tracking-[-0.03em]">
                  @{maker.username}
                </p>
                <p className="mt-1 text-[0.78rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                  Anthology curator · 12 drops
                </p>
              </div>
            </div>
            <p className="text-ink-soft dark:text-bone-soft leading-relaxed max-w-[44ch]">
              에이전트 시대를 가장 빨리 받아들이는 빌더 중 한 명. Claude Code 스킬과
              하이브리드 MCP 워크플로를 동시에 출시하며 카탈로그의 톤을 만들고 있어요.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['claude', 'mcp', 'workflows', 'agents'].map((t) => (
                <span
                  key={t}
                  className="font-mono text-[0.66rem] uppercase tracking-[0.16em] px-2.5 py-1 rounded-full bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft border border-line dark:border-night-line"
                >
                  {t}
                </span>
              ))}
            </div>
            <Link
              to={`/users/${maker.username}`}
              className="self-start group inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink font-medium text-[0.85rem] tracking-tight focus-volt lift-on-hover"
            >
              <Sparkles className="w-4 h-4" />
              메이커 페이지 보기
              <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Right: 3 drops vertically stacked */}
          <ul className="lg:col-span-7 flex flex-col gap-3">
            {maker.listings.length > 0 ? (
              maker.listings.map((l) => (
                <li key={l.id}>
                  <Link
                    to={`/listings/${l.slug}`}
                    className="group flex items-stretch gap-4 p-3 sm:p-4 rounded-2xl border border-line dark:border-night-line bg-canvas/70 dark:bg-night/40 hover:bg-canvas-deep/70 dark:hover:bg-night-deep/70 hover:border-volt-400/60 dark:hover:border-volt-500/40 motion-safe:transition"
                  >
                    <div
                      className={cn(
                        'shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-[2.5rem] sm:text-[3rem] bg-gradient-to-br',
                        typeGradient(l.type),
                      )}
                    >
                      {l.coverEmoji || LISTING_TYPE_META[l.type].emoji}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                      <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                        {LISTING_TYPE_META[l.type].label}
                      </span>
                      <h3 className="font-display font-semibold text-ink dark:text-bone text-[1.05rem] leading-tight line-clamp-2 group-hover:text-volt-800 dark:group-hover:text-volt-200 motion-safe:transition-colors">
                        {l.title}
                      </h3>
                      <p className="text-[0.83rem] text-ink-mute dark:text-bone-mute line-clamp-1">
                        {l.description}
                      </p>
                    </div>
                    <ArrowUpRight className="self-center w-5 h-5 text-ink-mute dark:text-bone-mute opacity-0 -translate-x-2 motion-safe:transition motion-safe:group-hover:opacity-100 motion-safe:group-hover:translate-x-0" />
                  </Link>
                </li>
              ))
            ) : (
              <li>
                <div className="p-8 rounded-2xl border border-dashed border-line dark:border-night-line text-center text-ink-mute dark:text-bone-mute">
                  곧 메이커의 첫 드롭이 여기에 떠요.
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bento featured grid ---------------------------------------- */

function BentoFeatured({ items }: { items: import('@/types').ListingCard[] }) {
  const [lead, ...rest] = items;
  if (!lead) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-gap-lg)] auto-rows-[minmax(0,1fr)]">
      <div className="sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2 min-w-0">
        <ListingCard listing={lead} variant="featured" />
      </div>
      {rest.slice(0, 4).map((l) => (
        <ListingCard key={l.id} listing={l} className="min-w-0" />
      ))}
    </div>
  );
}

/* ---------- Marquee strip ---------------------------------------------- */

const MARQUEE_WORDS = [
  '프롬프트',
  '에이전트',
  '스킬',
  'MCP 서버',
  '슬래시 커맨드',
  '.cursorrules',
  'claude.md',
  '서브에이전트',
  '에이전틱 워크플로',
];

function MarqueeStrip() {
  const items = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
  return (
    <div className="border-y border-line dark:border-night-line bg-ink text-bone dark:bg-bone dark:text-ink overflow-hidden">
      <div className="flex items-center gap-12 py-4 marquee-track whitespace-nowrap">
        {items.map((w, i) => (
          <span
            key={i}
            className="font-display font-bold tracking-[-0.04em] text-[clamp(1.5rem,2.4vw,2.4rem)] inline-flex items-center gap-12"
          >
            {w}
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full bg-volt-500 motion-safe:transition-transform"
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Seller CTA ------------------------------------------------- */

function SellerCallToAction() {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] surface-card border-line-strong dark:border-night-line-strong">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(at 18% 18%, oklch(0.92 0.18 122 / 0.6) 0, transparent 55%), radial-gradient(at 82% 82%, oklch(0.66 0.24 305 / 0.35) 0, transparent 55%)',
        }}
      />
      <div className="grain-layer" aria-hidden />
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-10 px-7 sm:px-10 lg:px-14 py-12 sm:py-16">
        <div className="lg:col-span-7">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink-soft mb-3">
            빌더를 위해
          </p>
          <h3
            className="font-display font-bold leading-[0.92] tracking-[-0.035em] text-ink display-tight"
            style={{ fontSize: 'var(--text-display-md)' }}
          >
            프롬프트를 만들었나요?{' '}
            <span className="block">이제 수익도 만드세요.</span>
          </h3>
          <p className="mt-5 text-ink-soft text-[1.05rem] leading-relaxed max-w-[44ch]">
            프롬프트, 스킬 번들, MCP 서버를 게시하세요. 스토어, 페이월, 정산은
            저희가 처리합니다. 빌더는 계속 빌드만 하면 돼요.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-ink/15 flex flex-col justify-center gap-5">
          <ul className="space-y-2.5 text-ink text-[0.95rem]">
            {[
              ['82%', '크리에이터 정산'],
              ['약 2분', '첫 리스팅까지 걸리는 시간'],
              ['0원', '초기 비용 · 월 구독료 없음'],
            ].map(([n, l]) => (
              <li key={l} className="flex items-baseline gap-3">
                <span className="font-mono text-volt-800 font-semibold w-20 shrink-0">{n}</span>
                <span className="text-ink-soft">{l}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2.5 pt-3">
            <Link
              to="/sell"
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-bone font-medium tracking-tight focus-volt lift-on-hover"
            >
              리스팅 시작
              <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-5 py-3 rounded-full border border-ink/20 text-ink font-medium tracking-tight hover:bg-ink/5 focus-volt motion-safe:transition"
            >
              대시보드 열기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
