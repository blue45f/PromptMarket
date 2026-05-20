import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  PlusCircle,
  ShoppingCart,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import { formatDollars } from '../lib/format';
import { cn } from '../lib/cn';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5 motion-safe:transition',
    isActive
      ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50'
      : 'text-gray-600 dark:text-zinc-300 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-gray-100 dark:hover:bg-zinc-800',
  );

export default function Navbar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { token, user, logout } = useAuthStore();

  function handleSearch(q: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    navigate(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function handleSignOut() {
    logout();
    qc.clear();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 h-16 backdrop-blur bg-white/80 dark:bg-zinc-950/80 border-b border-gray-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold"
            aria-hidden
          >
            P
          </span>
          <span className="font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
            PromptMarket
          </span>
        </Link>

        <div className="flex-1 max-w-md hidden md:block">
          <SearchBar onSubmit={handleSearch} />
        </div>

        <nav className="ml-auto flex items-center gap-1">
          <NavLink to="/browse" className={navLinkClass}>
            Browse
          </NavLink>
          {token && (
            <NavLink to="/sell" className={navLinkClass}>
              <PlusCircle className="w-4 h-4" /> Sell
            </NavLink>
          )}
          {token && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden lg:inline">Library</span>
            </NavLink>
          )}
          {token && user && (
            <NavLink to={`/users/${user.username}`} className={navLinkClass}>
              <UserIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Profile</span>
            </NavLink>
          )}

          <ThemeToggle />

          {token ? (
            <div className="flex items-center gap-2 ml-1">
              {user && typeof user.balanceCents === 'number' && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800">
                  <Wallet className="w-3.5 h-3.5" />
                  {formatDollars(user.balanceCents)}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md text-gray-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 motion-safe:transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link
                to="/login"
                className="text-sm font-medium px-3 py-1.5 rounded-md text-gray-700 dark:text-zinc-300 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
