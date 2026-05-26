import { Link } from 'react-router-dom';
import { useListings } from '@features/marketplace/queries';
import { getErrorMessage } from '@services/api';
import Hero from '@components/Hero';
import CategoryChips from '@components/CategoryChips';
import FeaturedCarousel from '@components/FeaturedCarousel';
import ListingCard from '@components/ListingCard';
import ModelTabs from '@components/ModelTabs';
import { SkeletonGrid } from '@components/SkeletonCard';
import EmptyState from '@components/EmptyState';

export default function HomePage() {
  const featuredQ = useListings({ sort: 'top', pageSize: 6 });
  const trendingQ = useListings({ sort: 'trending', pageSize: 8 });
  const recentQ = useListings({ sort: 'newest', pageSize: 8 });

  const featured = featuredQ.data?.items ?? [];
  const trending = trendingQ.data?.items ?? [];
  const recent = recentQ.data?.items ?? [];
  const error = trendingQ.error ?? recentQ.error ?? featuredQ.error;

  return (
    <div className="animate-fade-in">
      <Hero />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {error && (
          <p className="text-rose-600 dark:text-rose-400 text-sm">
            {getErrorMessage(error)}
          </p>
        )}

        <section>
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                Featured
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Hand-picked drops from the top of the marketplace.
              </p>
            </div>
            <Link
              to="/browse?sort=top"
              className="text-sm font-medium text-indigo-700 dark:text-indigo-400 hover:underline"
            >
              See all →
            </Link>
          </div>
          <FeaturedCarousel items={featured} loading={featuredQ.isPending} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
              Browse by category
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Jump straight to what you need.
            </p>
          </div>
          <CategoryChips />
        </section>

        <section>
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                Trending this week
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Most-loved prompts and agents right now.
              </p>
            </div>
            <Link
              to="/browse?sort=trending"
              className="text-sm font-medium text-indigo-700 dark:text-indigo-400 hover:underline"
            >
              See all →
            </Link>
          </div>
          {trendingQ.isPending ? (
            <SkeletonGrid count={8} />
          ) : trending.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trending.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="✨"
              title="No trending listings yet"
              description="Be the first to publish one."
            />
          )}
        </section>

        <section>
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                Recently added
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Fresh drops from the community.
              </p>
            </div>
            <Link
              to="/browse?sort=newest"
              className="text-sm font-medium text-indigo-700 dark:text-indigo-400 hover:underline"
            >
              See all →
            </Link>
          </div>
          {recentQ.isPending ? (
            <SkeletonGrid count={8} />
          ) : recent.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="🪺"
              title="Nothing here yet"
              description="Check back soon!"
            />
          )}
        </section>

        <section>
          <ModelTabs />
        </section>
      </div>
    </div>
  );
}
