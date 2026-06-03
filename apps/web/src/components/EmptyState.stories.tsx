import type { Meta, StoryObj } from '@storybook/react-vite'
import EmptyState from './EmptyState'

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  args: {
    emoji: '📭',
    title: '아직 결과가 없어요',
    description: '필터를 바꾸거나 검색어를 다시 입력해 보세요.',
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const TitleOnly: Story = {
  args: { description: undefined },
}

export const WithAction: Story = {
  args: {
    emoji: '🔍',
    title: '검색 결과가 없습니다',
    description: '다른 키워드로 다시 검색해 보세요.',
    action: (
      <button
        type="button"
        className="inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-bone dark:bg-bone dark:text-ink"
      >
        필터 초기화
      </button>
    ),
  },
}
