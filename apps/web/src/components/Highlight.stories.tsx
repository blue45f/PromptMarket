import Highlight from './Highlight'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Data Display/Highlight',
  component: Highlight,
  parameters: { layout: 'padded' },
  args: {
    text: 'Battle-tested prompts for Claude Code and Cursor agents',
    query: 'claude',
  },
  decorators: [
    (Story) => (
      <p className="max-w-md text-body text-ink dark:text-bone">
        <Story />
      </p>
    ),
  ],
} satisfies Meta<typeof Highlight>

export default meta
type Story = StoryObj<typeof meta>

export const SingleTerm: Story = {}

/** Whitespace-separated queries highlight each token independently. */
export const MultiTerm: Story = {
  args: { query: 'claude cursor' },
}

/** Empty query renders the original text untouched (no <mark>). */
export const NoQuery: Story = {
  args: { query: '' },
}

/** Case-insensitive matching. */
export const CaseInsensitive: Story = {
  args: { text: 'PROMPT, prompt, Prompt', query: 'prompt' },
}
