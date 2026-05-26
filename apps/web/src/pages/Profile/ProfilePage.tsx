import { useParams } from 'react-router-dom';
import { useUserProfile } from '@features/marketplace/queries';
import { getErrorMessage } from '@services/api';
import ListingCard from '@components/ListingCard';
import { SkeletonGrid } from '@components/SkeletonCard';
import EmptyState from '@components/EmptyState';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data, isPending, error } = useUserProfile(username);

  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-zinc-800 motion-safe:animate-pulse mb-6" />
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-rose-600 dark:text-rose-400">
          {error ? getErrorMessage(error) : 'User not found.'}
        </p>
      </div>
    );
  }

  // The API may return the profile flat or under a `user` key; normalise.
  type ProfileLike = {
    user?: { id: string; username: string; bio?: string | null };
    listings?: Array<Record<string, unknown>>;
    username?: string;
    bio?: string | null;
  };
  const raw = data as unknown as ProfileLike;
  const user = (raw.user ?? raw) as { username?: string; bio?: string | null };
  const listings = (raw.listings ?? []) as import('@/types').ListingCard[];

  const displayName = user.username ?? username ?? '?';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-sm"
          aria-hidden
        >
          {displayName[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            @{displayName}
          </h1>
          {user.bio && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
              {user.bio}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
            {listings.length} listing{listings.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-4">
          Listings
        </h2>
        {listings.length === 0 ? (
          <EmptyState
            emoji="🪺"
            title="Nothing here yet"
            description="This user hasn't published anything."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
