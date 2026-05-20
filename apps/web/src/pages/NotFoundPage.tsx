import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center animate-fade-in">
      <div className="text-6xl mb-4" aria-hidden>
        🧭
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        The page you were looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 motion-safe:transition active:scale-[0.98]"
      >
        Go home
      </Link>
    </div>
  );
}
