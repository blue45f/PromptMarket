import { useRelated } from '@domains/marketplace/queries'
import { useTranslation } from 'react-i18next'

import ListingCard from './ListingCard'
import SkeletonCard from './SkeletonCard'

import type { ListingCard as ListingCardType } from '@/types'

interface RelatedListingsProps {
  listingId: string | undefined
}

export default function RelatedListings({ listingId }: RelatedListingsProps) {
  const { t } = useTranslation('detail')
  const { data, isPending, isError } = useRelated(listingId)
  // The API may return either a bare array (legacy) or { items: [...] }.
  // Normalise both shapes so the component never crashes.
  const items: ListingCardType[] = Array.isArray(data)
    ? data
    : ((data as { items?: ListingCardType[] } | undefined)?.items ?? [])

  if (isPending) {
    return (
      <div className="cards-fluid">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-ink-mute dark:text-bone-mute">{t('related.error')}</p>
  }

  if (items.length === 0) {
    return <p className="text-sm text-ink-mute dark:text-bone-mute">{t('related.empty')}</p>
  }

  return (
    <div className="cards-fluid">
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  )
}
