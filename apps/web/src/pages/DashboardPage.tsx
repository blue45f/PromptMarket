import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '../lib/api';
import { useMyListings, useMyPurchases, useTopup } from '../lib/queries';
import { useAuthStore } from '../store/auth';
import ListingCard from '../components/ListingCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { formatDollars } from '../lib/format';
import { cn } from '../lib/cn';

type Tab = 'listings' | 'library' | 'wallet';

const TOPUP_AMOUNTS = [10, 50, 100];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('listings');
  const { user } = useAuthStore();

  const listingsQ = useMyListings();
  const libraryQ = useMyPurchases();
  const topupMut = useTopup();
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const myListings = Array.isArray(listingsQ.data) ? listingsQ.data : [];
  const library = Array.isArray(libraryQ.data) ? libraryQ.data : [];
  const loading = listingsQ.isPending || libraryQ.isPending;
  const error = listingsQ.error ?? libraryQ.error;

  async function handleTopup(dollars: number) {
    setPendingAmount(dollars);
    try {
      await topupMut.mutateAsync(dollars * 100);
    } catch {
      /* toast handled in hook */
    } finally {
      setPendingAmount(null);
    }
  }

  const totalEarnings = myListings.reduce(
    (sum, l) => sum + (l.earningsCents ?? 0),
    0,
  );
  const totalSales = myListings.reduce((sum, l) => sum + (l.salesCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-sm text-gray-500">Manage your listings, library, and wallet.</p>

      <div className="mt-6 border-b border-gray-200">
        <nav className="flex gap-1">
          {(
            [
              ['listings', 'My listings'],
              ['library', 'Library'],
              ['wallet', 'Wallet'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-2 -mb-px text-sm font-medium border-b-2 transition',
                tab === key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800',
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{getErrorMessage(error)}</p>
      )}

      <div className="mt-6">
        {tab === 'listings' && (
          <section>
            {loading ? (
              <Spinner className="py-12" label="Loading…" />
            ) : myListings.length === 0 ? (
              <EmptyState
                emoji="🪺"
                title="No listings yet"
                description="Publish your first prompt to start earning."
                action={
                  <Link
                    to="/sell"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
                  >
                    Create listing
                  </Link>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <StatCard label="Listings" value={myListings.length.toString()} />
                  <StatCard label="Total sales" value={totalSales.toString()} />
                  <StatCard label="Earnings" value={formatDollars(totalEarnings)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings.map((l) => (
                    <div key={l.id} className="relative">
                      <ListingCard listing={l} />
                      <div className="mt-2 px-1 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {l.salesCount ?? 0} sale{(l.salesCount ?? 0) === 1 ? '' : 's'}
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {formatDollars(l.earningsCents ?? 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {tab === 'library' && (
          <section>
            {loading ? (
              <Spinner className="py-12" label="Loading…" />
            ) : library.length === 0 ? (
              <EmptyState
                emoji="📚"
                title="Your library is empty"
                description="Purchased prompts show up here."
                action={
                  <Link
                    to="/browse"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
                  >
                    Browse marketplace
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {library.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'wallet' && (
          <section className="max-w-xl">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm text-gray-500">Current balance</p>
              <p className="mt-1 text-4xl font-bold text-gray-900">
                {formatDollars(user?.balanceCents ?? 0)}
              </p>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Top up</p>
                <div className="flex flex-wrap gap-2">
                  {TOPUP_AMOUNTS.map((amt) => {
                    const isThis = pendingAmount === amt;
                    return (
                      <button
                        key={amt}
                        onClick={() => handleTopup(amt)}
                        disabled={topupMut.isPending}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition disabled:opacity-60"
                      >
                        {isThis && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {isThis ? 'Loading…' : `+ $${amt}`}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  This is a demo wallet — top-ups are simulated and instant.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
