import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong';
  const message = error instanceof Error ? error.message : 'The page could not be rendered.';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex items-center justify-center px-4">
      <section className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
          Route error
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-zinc-400">
          {message}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 motion-safe:transition"
        >
          Go home
        </Link>
      </section>
    </main>
  );
}
