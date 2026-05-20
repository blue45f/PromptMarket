import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useMe } from '../lib/queries';

export default function Layout() {
  // Triggers the /auth/me query when a token is present and syncs the user
  // into the zustand store via the queryFn's side-effect.
  useMe();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 bg-white mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-500 flex flex-col sm:flex-row gap-2 justify-between">
          <p>© {new Date().getFullYear()} PromptMarket. Buy, sell &amp; share AI prompts.</p>
          <p className="text-xs text-gray-400">Made with coffee &amp; sparkles</p>
        </div>
      </footer>
    </div>
  );
}
