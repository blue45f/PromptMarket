import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import StatsStrip from './StatsStrip';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950 border-b border-gray-200 dark:border-zinc-800">
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl motion-safe:animate-pulse"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-zinc-900/80 backdrop-blur ring-1 ring-indigo-200 dark:ring-indigo-800 text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            Prompts · Skills · MCP · Agents
          </span>
          <h1 className="mt-6 text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-zinc-50 leading-[1.1]">
            The marketplace for{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              AI prompts &amp; agents
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-zinc-400 max-w-2xl">
            Discover battle-tested prompts, CLAUDE.md files, Claude Code skills,
            MCP servers, and sub-agents from builders shipping with frontier
            models. Buy, sell, and remix.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/browse"
              className="inline-flex items-center px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 motion-safe:transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Browse Marketplace
            </Link>
            <Link
              to="/sell"
              className="inline-flex items-center px-5 py-3 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 font-semibold border border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 motion-safe:transition active:scale-[0.98]"
            >
              Sell a Prompt
            </Link>
          </div>
        </div>

        <StatsStrip className="mt-14 lg:mt-20" />
      </div>
    </section>
  );
}
