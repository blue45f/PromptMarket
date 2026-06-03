import type { Meta, StoryObj } from '@storybook/react-vite'
import CategoryChips from './CategoryChips'

/**
 * Horizontal, scrollable navigation rail of catalog categories. Each chip is a
 * router Link; the active chip is rendered solid. (Router is provided globally
 * by the Storybook preview decorator.)
 */
const meta = {
  title: 'Navigation/CategoryChips',
  component: CategoryChips,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
  args: {},
} satisfies Meta<typeof CategoryChips>

export default meta
type Story = StoryObj<typeof meta>

/** No active category — the "All" chip is highlighted. */
export const Default: Story = {}

export const ActiveCategory: Story = {
  args: { active: 'Coding' },
}
