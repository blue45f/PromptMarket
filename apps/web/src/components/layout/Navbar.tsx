import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  Menu,
  PlusCircle,
  ShoppingCart,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';
import { useAuthStore } from '@store/auth';
import SearchBar from '@components/SearchBar';
import ThemeToggle from '@components/ThemeToggle';
import { formatDollars } from '@utils/format';
import { cn } from '@utils/cn';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative inline-flex items-center gap-1.5 text-[0.83rem] font-medium px-3 py-1.5 rounded-full tracking-tight',
    'motion-safe:transition-colors duration-300',
    isActive
      ? 'text-ink dark:text-bone'
      : 'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone',
  );

function NavLinkInner({ isActive, children }: { isActive: boolean; children: React.ReactNode }) {
  return (
    <>
      {children}
      <span
        aria-hidden
        className={cn(
          'absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-volt-500',
          'origin-left motion-safe:transition-transform motion-safe:duration-300',
          isActive ? 'scale-x-100' : 'scale-x-0',
        )}
      />
    </>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { token, user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu on route changes
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  function handleSearch(q: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    navigate(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
    setMobileOpen(false);
  }

  function handleSignOut() {
    logout();
    qc.clear();
    navigate('/');
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 surface-glass border-b border-line dark:border-night-line">
      <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] h-16 flex items-center gap-3 lg:gap-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0 focus-volt"
          onClick={() => setMobileOpen(false)}
        >
          <span
            aria-hidden
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-ink text-volt-300 dark:bg-volt-300 dark:text-ink font-display font-bold text-[1.05rem] -rotate-3"
          >
            P
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-volt-500 ring-2 ring-canvas dark:ring-night volt-pulse" />
          </span>
          <span className="font-display font-bold text-[1.05rem] text-ink dark:text-bone tracking-tight display-tight">
            PromptMarket
          </span>
        </Link>

        <div className="flex-1 max-w-md hidden md:block">
          <SearchBar onSubmit={handleSearch} />
        </div>

        <nav className="ml-auto hidden md:flex items-center gap-1">
          <NavLink to="/browse" className={navLinkClass}>
            {({ isActive }) => <NavLinkInner isActive={isActive}>둘러보기</NavLinkInner>}
          </NavLink>
          {token && (
            <NavLink to="/sell" className={navLinkClass}>
              {({ isActive }) => (
                <NavLinkInner isActive={isActive}>
                  <PlusCircle className="w-4 h-4" /> 판매
                </NavLinkInner>
              )}
            </NavLink>
          )}
          {token && (
            <NavLink to="/dashboard" className={navLinkClass}>
              {({ isActive }) => (
                <NavLinkInner isActive={isActive}>
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden lg:inline">라이브러리</span>
                </NavLinkInner>
              )}
            </NavLink>
          )}
          {token && user && (
            <NavLink to={`/users/${user.username}`} className={navLinkClass}>
              {({ isActive }) => (
                <NavLinkInner isActive={isActive}>
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden lg:inline">프로필</span>
                </NavLinkInner>
              )}
            </NavLink>
          )}

          <span className="mx-1.5 hidden lg:inline-block w-px h-5 bg-line dark:bg-night-line" aria-hidden />

          <ThemeToggle />

          {token ? (
            <div className="flex items-center gap-2 ml-1">
              {user && typeof user.balanceCents === 'number' && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.72rem] font-mono font-medium bg-volt-100 text-volt-800 ring-1 ring-volt-200 dark:bg-volt-900/60 dark:text-volt-200 dark:ring-volt-800">
                  <Wallet className="w-3.5 h-3.5" />
                  {formatDollars(user.balanceCents)}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full text-ink-soft dark:text-bone-soft hover:text-coral-deep dark:hover:text-coral motion-safe:transition focus-volt"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 ml-1">
              <Link
                to="/login"
                className="text-[0.83rem] font-medium px-3 py-1.5 rounded-full text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone motion-safe:transition focus-volt"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="group relative overflow-hidden text-[0.83rem] font-semibold px-4 py-1.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink lift-on-hover focus-volt"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
                />
                <span className="relative group-hover:text-ink motion-safe:transition-colors motion-safe:duration-300">
                  회원가입
                </span>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile */}
        <div className="ml-auto md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub focus-volt motion-safe:transition active:scale-95"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-line dark:border-night-line bg-canvas dark:bg-night animate-fade-in">
          <div className="px-[clamp(1.25rem,4vw,3rem)] py-4 space-y-3">
            <SearchBar onSubmit={handleSearch} />
            <nav className="flex flex-col text-[0.95rem] font-medium font-display divide-y divide-line dark:divide-night-line">
              <Link
                onClick={() => setMobileOpen(false)}
                to="/browse"
                className="py-3 inline-flex items-center justify-between text-ink dark:text-bone"
              >
                둘러보기 <span aria-hidden>→</span>
              </Link>
              {token && (
                <Link
                  onClick={() => setMobileOpen(false)}
                  to="/sell"
                  className="py-3 inline-flex items-center justify-between text-ink dark:text-bone"
                >
                  프롬프트 판매 <span aria-hidden>→</span>
                </Link>
              )}
              {token && (
                <Link
                  onClick={() => setMobileOpen(false)}
                  to="/dashboard"
                  className="py-3 inline-flex items-center justify-between text-ink dark:text-bone"
                >
                  라이브러리 <span aria-hidden>→</span>
                </Link>
              )}
              {token && user && (
                <Link
                  onClick={() => setMobileOpen(false)}
                  to={`/users/${user.username}`}
                  className="py-3 inline-flex items-center justify-between text-ink dark:text-bone"
                >
                  프로필 <span aria-hidden>→</span>
                </Link>
              )}
              {!token && (
                <>
                  <Link
                    onClick={() => setMobileOpen(false)}
                    to="/login"
                    className="py-3 inline-flex items-center justify-between text-ink dark:text-bone"
                  >
                    로그인 <span aria-hidden>→</span>
                  </Link>
                  <Link
                    onClick={() => setMobileOpen(false)}
                    to="/register"
                    className="py-3 inline-flex items-center justify-between text-volt-700 dark:text-volt-300"
                  >
                    회원가입 <span aria-hidden>→</span>
                  </Link>
                </>
              )}
              {token && (
                <button
                  onClick={handleSignOut}
                  className="py-3 inline-flex items-center justify-between text-coral-deep dark:text-coral"
                >
                  로그아웃 <LogOut className="w-4 h-4" />
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
