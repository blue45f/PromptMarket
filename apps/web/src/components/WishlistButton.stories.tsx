import WishlistButton from './WishlistButton'

import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Heart toggle backed by the global wishlist zustand store (localStorage).
 * Clicking persists the slug; reload keeps the state. Each story uses a
 * distinct slug so they toggle independently.
 */
const meta = {
  title: 'Actions/WishlistButton',
  component: WishlistButton,
  argTypes: {
    variant: { control: 'inline-radio', options: ['card', 'inline'] },
  },
  args: { slug: 'sb-wishlist-demo', variant: 'card' },
} satisfies Meta<typeof WishlistButton>

export default meta
type Story = StoryObj<typeof meta>

/** Floating chip used on cover art. */
export const Card: Story = {
  args: { variant: 'card', slug: 'sb-wishlist-card' },
  decorators: [
    (Story) => (
      <div className="rounded-xl bg-gradient-to-br from-volt-300 to-iris p-10">
        <Story />
      </div>
    ),
  ],
}

/** Labelled button for sidebars / detail pages. */
export const Inline: Story = {
  args: { variant: 'inline', slug: 'sb-wishlist-inline' },
}
