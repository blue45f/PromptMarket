import EmptyState from '@components/EmptyState'
import {
  parsePolicyBody,
  policyPublicUrl,
  usePolicy,
  type PolicyBlock,
  type PolicySlug,
} from '@features/policies'
import { usePageMeta } from '@hooks/usePageMeta'
import { formatDate } from '@utils/format'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import { createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

/** Trust-surface hash is truncated to its first 12 hex chars; full value stays in `title`. */
const SHORT_HASH_LENGTH = 12

const HEADING_CLASS: Record<number, string> = {
  2: 'mt-10 text-[1.18rem]',
  3: 'mt-8 text-[1.05rem]',
  4: 'mt-7 text-[0.98rem]',
  5: 'mt-6 text-[0.94rem]',
  6: 'mt-6 text-[0.9rem]',
}

function PolicyBody({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <div className="mt-8">
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          return createElement(
            `h${block.level}`,
            {
              key: index,
              className: `font-display font-bold tracking-tight text-ink dark:text-bone ${HEADING_CLASS[block.level]}`,
            },
            block.text
          )
        }
        if (block.kind === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag
              key={index}
              className={`mt-3 space-y-1.5 pl-5 max-w-[72ch] text-[0.95rem] leading-relaxed text-ink-soft dark:text-bone-soft marker:text-volt-700 dark:marker:text-volt-300 ${
                block.ordered ? 'list-decimal' : 'list-disc'
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ListTag>
          )
        }
        if (block.kind === 'divider') {
          return <hr key={index} className="my-8 border-line dark:border-night-line" />
        }
        return (
          <p
            key={index}
            className="mt-3 max-w-[72ch] text-[0.95rem] leading-relaxed text-ink-soft dark:text-bone-soft whitespace-pre-line"
          >
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

function PolicySkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="mt-10 space-y-8">
      <span className="sr-only">{label}</span>
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} aria-hidden className="space-y-3">
          <div className="h-5 w-44 rounded bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse" />
          <div className="h-4 w-full max-w-[60ch] rounded bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse" />
          <div className="h-4 w-full max-w-[52ch] rounded bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse" />
          <div className="h-4 w-2/3 max-w-[40ch] rounded bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function PolicyPage() {
  const { t } = useTranslation('policy')
  const { pathname } = useLocation()

  const isPrivacy = pathname === '/privacy'
  const kind = isPrivacy ? 'privacy' : 'terms'
  const slug: PolicySlug = isPrivacy ? 'privacy-policy' : 'terms-of-service'
  const fallbackTitle = t(`${kind}.title`)

  const { data, isPending, isError, refetch } = usePolicy(slug)

  usePageMeta({
    title: t(`${kind}.metaTitle`),
    description: t(`${kind}.metaDescription`),
  })

  const externalUrl = policyPublicUrl(slug)

  return (
    <article className="animate-fade-in mx-auto max-w-[880px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2.5rem,6vw,5rem)]">
      <header>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-6 h-px bg-volt-500" />
          {t('eyebrow')}
        </p>
        <h1
          className="mt-4 font-display font-bold text-ink dark:text-bone tracking-[-0.035em] leading-[1.02] display-condense"
          style={{ fontSize: 'clamp(2.1rem, 5vw, 3.4rem)' }}
        >
          {data?.name ?? fallbackTitle}
        </h1>
      </header>

      {isPending && <PolicySkeleton label={t('loading')} />}

      {isError && (
        <EmptyState
          variant="gated"
          emoji="📄"
          headingLevel={2}
          title={t('error.title')}
          description={t('error.body')}
          className="mt-10"
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void refetch()}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight lift-on-hover focus-volt"
              >
                <RotateCcw aria-hidden className="w-4 h-4" />
                {t('error.retry')}
              </button>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-ink/15 dark:border-bone/20 text-ink dark:text-bone font-medium tracking-tight hover:border-ink dark:hover:border-bone motion-safe:transition ease-expo focus-volt"
              >
                {t('error.openSource')}
                <ArrowUpRight aria-hidden className="w-4 h-4" />
              </a>
            </div>
          }
        />
      )}

      {data && (
        <>
          <PolicyBody blocks={parsePolicyBody(data.body)} />

          {/* Trust surface — version, effective date, content hash, source link. */}
          <footer className="mt-14 pt-6 border-t border-line dark:border-night-line">
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
              <dl className="flex flex-wrap gap-x-10 gap-y-5">
                <div>
                  <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
                    {t('trust.version')}
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-ink dark:text-bone tabular-nums">
                    {data.versionLabel}
                  </dd>
                </div>
                {data.effectiveAt && (
                  <div>
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
                      {t('trust.effectiveAt')}
                    </dt>
                    <dd className="mt-1 font-mono text-sm text-ink dark:text-bone tabular-nums">
                      {formatDate(data.effectiveAt)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
                    {t('trust.hash')}
                  </dt>
                  <dd className="mt-1">
                    <code
                      title={data.contentHash}
                      className="font-mono text-sm text-ink dark:text-bone bg-canvas-deep dark:bg-night-sub rounded px-1.5 py-0.5"
                    >
                      {data.contentHash.slice(0, SHORT_HASH_LENGTH)}
                    </code>
                  </dd>
                </div>
              </dl>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute hover:text-volt-700 dark:hover:text-volt-300 motion-safe:transition ease-expo focus-volt"
              >
                {t('trust.source')}
                <ArrowUpRight
                  aria-hidden
                  className="w-3.5 h-3.5 motion-safe:transition-transform ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </footer>
        </>
      )}

      <nav
        aria-label={t('nav.label')}
        className="mt-12 pt-6 border-t border-line dark:border-night-line flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <Link
          to="/"
          className="text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
        >
          ← {t('nav.backHome')}
        </Link>
        <Link
          to={isPrivacy ? '/terms' : '/privacy'}
          className="font-medium text-ink dark:text-bone underline underline-offset-[3px] decoration-volt-400 hover:decoration-volt-500 focus-volt"
        >
          {isPrivacy ? t('terms.title') : t('privacy.title')} →
        </Link>
      </nav>
    </article>
  )
}
