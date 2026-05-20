import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, PlusCircle, ShoppingCart, User as UserIcon, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import SearchBar from './SearchBar';
import { formatDollars } from '../lib/format';
import { cn } from '../lib/cn';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium px-2 py-1 rounded-md transition inline-flex items-center gap-1.5',
    isActive ? 'text-brand-700 bg-brand-50' : 'text-gray-600 hover:text-brand-700',
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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white font-bold">
            P
          </span>
          <span className="font-semibold text-gray-900">PromptMarket</span>
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
              <ShoppingCart className="w-4 h-4" /> Library
            </NavLink>
          )}
          {token && user && (
            <NavLink to={`/users/${user.username}`} className={navLinkClass}>
              <UserIcon className="w-4 h-4" /> Profile
            </NavLink>
          )}

          {token ? (
            <div className="flex items-center gap-2 ml-2">
              {user && typeof user.balanceCents === 'number' && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Wallet className="w-3.5 h-3.5" />
                  {formatDollars(user.balanceCents)}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md text-gray-600 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                to="/login"
                className="text-sm font-medium px-3 py-1.5 rounded-md text-gray-700 hover:text-brand-700"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 transition"
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
