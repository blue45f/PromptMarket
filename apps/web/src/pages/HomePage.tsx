import { Link } from 'react-router-dom';
import { useListings } from '../lib/queries';
import { getErrorMessage } from '../lib/api';
import ListingCard from '../components/ListingCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

export default function HomePage() {
  const trendingQ = useListings({ sort: 'trending', pageSize: 8 });
  const recentQ = useListings({ sort: 'newest', pageSize: 8 });

  const trending = trendingQ.data?.items ?? [];
  const recent = recentQ.data?.items ?? [];
  const loading = trendingQ.isPending || recentQ.isPending;
  const error = trendingQ.error ?? recentQ.error;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-400 text-white px-8 py-14 sm:px-12 sm:py-20 shadow-sm">
        <div className="max-w-2xl">
          <p className="uppercase text-xs tracking-widest text-brand-100 font-semibold">
            The marketplace for AI prompts
          </p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-bold leading-tight">
            Buy, sell &amp; share prompts, CLAUDE.md and agent.md files.
          </h1>
          <p className="mt-4 text-brand-50 text-base sm:text-lg">
            Discover battle-tested prompts from the community. Monetize your best work.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/browse"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-white text-brand-700 font-semibold hover:bg-brand-50 transition"
            >
              Browse marketplace
            </Link>
            <Link
              to="/sell"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-brand-900/30 text-white font-semibold hover:bg-brand-900/50 transition border border-white/30"
            >
              Start selling
            </Link>
          </div>
        </div>
      </section>

      {error && <p className="text-red-600 text-sm">{getErrorMessage(error)}</p>}

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">🔥 Trending</h2>
            <p className="text-sm text-gray-500">Most-loved prompts this week.</p>
          </div>
          <Link to="/browse?sort=trending" className="text-sm font-medium text-brand-700 hover:underline">
            See all →
          </Link>
        </div>
        {loading ? (
          <Spinner className="py-10" label="Loading…" />
        ) : trending.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <EmptyState emoji="✨" title="No trending listings yet" description="Be the first to publish one." />
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">🆕 Recently added</h2>
            <p className="text-sm text-gray-500">Fresh drops from the community.</p>
          </div>
          <Link to="/browse?sort=newest" className="text-sm font-medium text-brand-700 hover:underline">
            See all →
          </Link>
        </div>
        {loading ? (
          <Spinner className="py-10" label="Loading…" />
        ) : recent.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recent.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <EmptyState emoji="🪺" title="Nothing here yet" description="Check back soon!" />
        )}
      </section>
    </div>
  );
}
