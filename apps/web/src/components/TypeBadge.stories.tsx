import { ListingType } from '@promptmarket/shared'

import TypeBadge from './TypeBadge'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Badges/TypeBadge',
  component: TypeBadge,
  argTypes: {
    type: { control: 'select', options: ListingType.options },
    overlay: { control: 'boolean' },
  },
  args: { type: 'PROMPT', overlay: false },
} satisfies Meta<typeof TypeBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Translucent overlay variant — used on top of cover art. */
export const Overlay: Story = {
  args: { type: 'MCP_SERVER', overlay: true },
  decorators: [
    (Story) => (
      <div className="rounded-xl bg-gradient-to-br from-violet to-iris p-8">
        <Story />
      </div>
    ),
  ],
}

export const AllTypes: Story = {
  render: () => (
    <div className="flex max-w-md flex-wrap gap-2">
      {ListingType.options.map((t) => (
        <TypeBadge key={t} type={t} />
      ))}
    </div>
  ),
}
