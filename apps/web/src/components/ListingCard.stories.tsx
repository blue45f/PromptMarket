import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ListingCard as ListingCardType } from '@/types'
import ListingCard from './ListingCard'

/**
 * The marketplace's primary catalog tile. Wraps in a router Link, renders the
 * type/model/rating signals, a wishlist heart, and (optionally) a compare
 * toggle. Router + React Query come from the global preview decorator.
 */
const baseListing: ListingCardType = {
  id: 'l1',
  slug: 'production-grade-refactor-prompt',
  title: 'Production-grade Refactor Prompt',
  type: 'PROMPT',
  description:
    'A battle-tested prompt that turns sprawling legacy modules into clean, typed, well-named units — without changing behavior.',
  category: 'Coding',
  tags: ['refactor', 'typescript', 'cleanup'],
  models: ['claude-opus-4-7', 'gpt-5', 'cursor'],
  technique: 'chain-of-thought',
  difficulty: 'intermediate',
  license: 'MIT',
  version: '1.2.0',
  priceCents: 499,
  coverEmoji: '🧼',
  downloads: 1284,
  avgRating: 4.7,
  reviewCount: 36,
  createdAt: '2026-05-20T00:00:00Z',
  author: { id: 'a1', username: 'refactor_guru' },
}

const meta = {
  title: 'Marketplace/ListingCard',
  component: ListingCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
  args: { listing: baseListing },
} satisfies Meta<typeof ListingCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Free: Story = {
  args: { listing: { ...baseListing, priceCents: 0 } },
}

export const Unrated: Story = {
  args: { listing: { ...baseListing, avgRating: 0, reviewCount: 0, downloads: 0 } },
}

export const Featured: Story = {
  args: { variant: 'featured' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
}

/** Search-result variant: the query is underlined inside the title/description. */
export const WithHighlight: Story = {
  args: { highlight: 'refactor' },
}

/** Compare-mode toggle (does not navigate the card). */
export const WithCompareToggle: Story = {
  args: {
    compare: { selected: true, disabled: false, onToggle: () => {} },
  },
}
