import { PromptTechnique } from '@promptmarket/shared'

import TechniqueBadge from './TechniqueBadge'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Badges/TechniqueBadge',
  component: TechniqueBadge,
  argTypes: {
    technique: { control: 'select', options: PromptTechnique.options },
    showHint: { control: 'boolean' },
  },
  args: { technique: 'chain-of-thought', showHint: false },
} satisfies Meta<typeof TechniqueBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** With the inline hint shown (visible from the `sm` breakpoint up). */
export const WithHint: Story = {
  args: { showHint: true },
}

export const AllTechniques: Story = {
  render: () => (
    <div className="flex max-w-lg flex-wrap gap-2">
      {PromptTechnique.options.map((tech) => (
        <TechniqueBadge key={tech} technique={tech} />
      ))}
    </div>
  ),
}
