import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { Copy, Download, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@services/api';
import { useMyListings, useMyPurchases, useTopup } from '@features/marketplace/queries';
import { useAuthStore } from '@store/auth';
import ListingCard from '@components/ListingCard';
import { SkeletonGrid } from '@components/SkeletonCard';
import EmptyState from '@components/EmptyState';
import { formatDollars } from '@utils/format';
import { cn } from '@utils/cn';
import toast from 'react-hot-toast';

const TOPUP_AMOUNTS = [10, 50, 100];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const listingsQ = useMyListings();
  const libraryQ = useMyPurchases();
  const topupMut = useTopup();
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const myListings = Array.isArray(listingsQ.data) ? listingsQ.data : [];
  const library = Array.isArray(libraryQ.data) ? libraryQ.data : [];
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
        Dashboard
      </h1>
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        Manage your listings, library, and wallet.
      </p>

      <Tabs.Root defaultValue="listings" className="mt-6">
        <Tabs.List
          aria-label="Dashboard sections"
          className="flex gap-1 border-b border-gray-200 dark:border-zinc-800"
        >
          {(
            [
              ['listings', 'My listings'],
              ['library', 'Library'],
              ['wallet', 'Wallet'],
            ] as const
          ).map(([key, label]) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className={cn(
                'px-4 py-2 -mb-px text-sm font-medium border-b-2 motion-safe:transition',
                'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200',
                'data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700',
                'dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-300',
              )}
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {error && (
          <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">
            {getErrorMessage(error)}
          </p>
        )}

        <Tabs.Content value="listings" className="mt-6 focus-visible:outline-none">
          {listingsQ.isPending ? (
            <SkeletonGrid count={6} />
          ) : myListings.length === 0 ? (
            <EmptyState
              emoji="🪺"
              title="No listings yet"
              description="Publish your first prompt to start earning."
              action={
                <Link
                  to="/sell"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 motion-safe:transition"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myListings.map((l) => (
                  <div key={l.id} className="relative">
                    <ListingCard listing={l} />
                    <div className="mt-2 px-1 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                      <span>
                        {l.salesCount ?? 0} sale{(l.salesCount ?? 0) === 1 ? '' : 's'}
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatDollars(l.earningsCents ?? 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Tabs.Content>

        <Tabs.Content value="library" className="mt-6 focus-visible:outline-none">
          {libraryQ.isPending ? (
            <SkeletonGrid count={6} />
          ) : library.length === 0 ? (
            <EmptyState
              emoji="📚"
              title="Your library is empty"
              description="Purchased prompts show up here."
              action={
                <Link
                  to="/browse"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 motion-safe:transition"
                >
                  Browse marketplace
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {library.map((l) => (
                <div key={l.id} className="space-y-2">
                  <ListingCard listing={l} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(`/listings/${l.slug}`)
                          .then(() => toast.success('Link copied'))
                          .catch(() => undefined);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 motion-safe:transition"
                    >
                      <Copy className="w-3 h-3" />
                      Copy link
                    </button>
                    <Link
                      to={`/listings/${l.slug}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 motion-safe:transition"
                    >
                      <Download className="w-3 h-3" />
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="wallet" className="mt-6 focus-visible:outline-none max-w-xl">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Current balance
            </p>
            <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
              {formatDollars(user?.balanceCents ?? 0)}
            </p>

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-200 mb-2">
                Top up
              </p>
              <div className="flex flex-wrap gap-2">
                {TOPUP_AMOUNTS.map((amt) => {
                  const isThis = pendingAmount === amt;
                  return (
                    <button
                      key={amt}
                      onClick={() => handleTopup(amt)}
                      disabled={topupMut.isPending}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 motion-safe:transition active:scale-[0.98] disabled:opacity-60"
                    >
                      {isThis && (
                        <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin" />
                      )}
                      {isThis ? 'Loading…' : `+ $${amt}`}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-zinc-400">
                This is a demo wallet — top-ups are simulated and instant.
              </p>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 font-semibold">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
        {value}
      </p>
    </div>
  );
}
