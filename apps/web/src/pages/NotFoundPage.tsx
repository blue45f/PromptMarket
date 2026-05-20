import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="text-6xl mb-4">🧭</div>
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        The page you were looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
      >
        Go home
      </Link>
    </div>
  );
}
