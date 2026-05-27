import { Link, Outlet } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Navbar from './Navbar';
import CommandPalette from '@components/CommandPalette';
import ShortcutsOverlay from '@components/ShortcutsOverlay';
import { useMe } from '@features/marketplace/queries';
import { useNavShortcuts } from '@hooks/useNavShortcuts';
import { useSpotlight } from '@hooks/useSpotlight';
import { useReveal } from '@hooks/useReveal';

export default function Layout() {
  // Triggers the /auth/me query when a token is present and syncs the user
  // into the zustand store via the queryFn's side-effect.
  useMe();
  // Two-key navigation sequences (g h, g b, g d, g s, g l)
  useNavShortcuts();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CommandPalette />
      <ShortcutsOverlay />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  const spotlightRef = useSpotlight<HTMLElement>();
  const { ref: wordmarkRef, revealed } = useReveal<HTMLDivElement>();
  return (
    <footer
      ref={spotlightRef}
      className="spotlight-host relative isolate mt-[clamp(4rem,8vw,8rem)] bg-ink text-bone overflow-hidden"
    >
      <div className="spotlight" aria-hidden style={{ ['--spot-color' as string]: 'oklch(0.83 0.23 124 / 0.18)' }} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(at 10% 0%, oklch(0.5 0.18 130 / 0.3) 0, transparent 55%), radial-gradient(at 90% 0%, oklch(0.55 0.22 305 / 0.25) 0, transparent 55%)',
        }}
      />
      <div className="grain-layer" aria-hidden style={{ opacity: 0.18, mixBlendMode: 'overlay' }} />

      <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-10">
          {/* Left: link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10 text-sm">
            <FooterCol
              chapter="01"
              title="마켓플레이스"
              links={[
                { to: '/browse', label: '전체 보기' },
                { to: '/browse?sort=trending', label: '트렌딩' },
                { to: '/browse?sort=newest', label: '최신순' },
                { to: '/browse?free=true', label: '무료' },
              ]}
            />
            <FooterCol
              chapter="02"
              title="판매"
              links={[
                { to: '/sell', label: '프롬프트 등록' },
                { to: '/sell', label: '스킬 등록' },
                { to: '/sell', label: 'MCP 등록' },
                { to: '/dashboard', label: '대시보드' },
              ]}
            />
            <FooterCol
              chapter="03"
              title="계정"
              links={[
                { to: '/login', label: '로그인' },
                { to: '/register', label: '회원가입' },
                { to: '/dashboard', label: '라이브러리' },
              ]}
            />
            <FooterCol
              chapter="04"
              title="모델"
              links={[
                { to: '/browse?vendor=Anthropic', label: 'Anthropic' },
                { to: '/browse?vendor=OpenAI', label: 'OpenAI' },
                { to: '/browse?vendor=Google', label: 'Google' },
                { to: '/browse?vendor=Meta', label: 'Meta' },
              ]}
            />
          </div>

          {/* Right: subscribe / about */}
          <div className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-bone/15 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-volt-300">
              <span className="w-1.5 h-1.5 rounded-full bg-volt-500 volt-pulse" />
              앤솔로지 · vol.01 · MMVI
            </div>
            <p className="text-bone-soft text-[1.05rem] leading-relaxed max-w-[44ch]">
              에이전트 시대를 위한 카탈로그. 실제 프로덕션에서 동작하는 모델용으로
              검증된 프롬프트, 스킬, 에이전트를 사고팝니다.
            </p>
            <Link
              to="/sell"
              className="self-start group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-volt-300 text-ink font-medium tracking-tight lift-on-hover focus-volt"
            >
              내 작업 등록
              <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* Mega wordmark — solid bone, with a lime hairline drawn beneath. */}
        <div
          ref={wordmarkRef}
          data-revealed={revealed}
          className="reveal relative mt-14 lg:mt-20 -mb-2 lg:-mb-4 overflow-hidden"
        >
          <p
            aria-hidden
            className="font-display font-bold leading-none tracking-[-0.06em] display-condense whitespace-nowrap select-none text-bone"
            style={{ fontSize: 'clamp(4rem, 18vw, 18rem)' }}
          >
            PromptMarket
          </p>
          <span
            aria-hidden
            className="absolute left-0 right-0 bottom-[6%] h-[clamp(0.4rem,1vw,1rem)] bg-volt-400 origin-left scale-x-0 motion-safe:[transition:transform_1.2s_cubic-bezier(0.16,1,0.3,1)]"
            data-bar
          />
        </div>

        {/* Bottom strip */}
        <div className="mt-8 pt-6 border-t border-bone/15 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-[0.78rem] font-mono uppercase tracking-[0.14em] text-bone-mute">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-volt-300 text-ink font-display font-bold -rotate-3 text-xs"
            >
              P
            </span>
            <span>© {new Date().getFullYear()} PromptMarket</span>
          </div>
          <p className="text-bone-mute">에이전트 시대를 위해 · 손맛으로 빚었습니다</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  chapter,
  title,
  links,
}: {
  chapter: string;
  title: string;
  links: Array<{ to: string; label: string }>;
}) {
  return (
    <div className="space-y-3.5">
      <div className="space-y-1">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-volt-300/80">
          {chapter}
        </p>
        <p className="font-display font-bold text-bone tracking-tight">{title}</p>
      </div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              className="group inline-flex items-center gap-1 text-bone-soft hover:text-volt-300 motion-safe:transition"
            >
              {l.label}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 motion-safe:transition motion-safe:group-hover:opacity-100 motion-safe:group-hover:translate-x-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
