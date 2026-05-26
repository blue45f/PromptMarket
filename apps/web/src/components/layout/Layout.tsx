import { Link, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useMe } from '@features/marketplace/queries';

export default function Layout() {
  // Triggers the /auth/me query when a token is present and syncs the user
  // into the zustand store via the queryFn's side-effect.
  useMe();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 bg-gray-100 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold"
                aria-hidden
              >
                P
              </span>
              <span className="font-semibold text-gray-900 dark:text-zinc-100">
                PromptMarket
              </span>
            </div>
            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed">
              Buy, sell &amp; share AI prompts, skills, MCP servers and agents.
            </p>
          </div>
          <FooterCol
            title="Marketplace"
            links={[
              { to: '/browse', label: 'Browse' },
              { to: '/browse?sort=trending', label: 'Trending' },
              { to: '/browse?sort=newest', label: 'Newest' },
              { to: '/browse?free=true', label: 'Free' },
            ]}
          />
          <FooterCol
            title="Sell"
            links={[
              { to: '/sell', label: 'List a prompt' },
              { to: '/dashboard', label: 'Dashboard' },
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              { to: '/login', label: 'Sign in' },
              { to: '/register', label: 'Sign up' },
            ]}
          />
        </div>
        <div className="border-t border-gray-200 dark:border-zinc-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row gap-2 justify-between text-xs text-gray-500 dark:text-zinc-400">
            <p>© {new Date().getFullYear()} PromptMarket.</p>
            <p>Crafted for the agentic era.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ to: string; label: string }>;
}) {
  return (
    <div>
      <p className="font-semibold text-gray-900 dark:text-zinc-100 mb-3">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              className="text-gray-600 dark:text-zinc-400 hover:text-indigo-700 dark:hover:text-indigo-300 motion-safe:transition"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
