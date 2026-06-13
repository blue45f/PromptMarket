import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, Trash2 } from 'lucide-react'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'soft', 'outline', 'ghost', 'danger'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: { children: '버튼', variant: 'primary', size: 'md' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Soft: Story = { args: { variant: 'soft' } }
export const Outline: Story = { args: { variant: 'outline' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: (
      <>
        <Trash2 aria-hidden />
        삭제
      </>
    ),
  },
}

/** Every variant side by side for a quick a11y / contrast sweep. */
export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="soft">
        Soft
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
    </div>
  ),
}

/** Size scale. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        계속하기
        <ArrowRight aria-hidden />
      </>
    ),
  },
}

export const Disabled: Story = { args: { disabled: true } }

/** `asChild` projects button styling onto an anchor via Radix Slot. */
export const AsChildLink: Story = {
  args: { variant: 'outline' },
  render: (args) => (
    <Button {...args} asChild>
      <a href="#button">링크처럼 보이는 버튼</a>
    </Button>
  ),
}
