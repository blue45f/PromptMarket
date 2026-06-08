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

/** `discover` — browse/library/search results that came back empty. */
export const Discover: Story = {
  args: {
    variant: 'discover',
    emoji: '📚',
    title: '라이브러리가 비어 있어요',
    description: '구매한 리스팅이 여기에 보여요. 우선 무료부터 골라 보세요.',
  },
}

/** `gated` — the visitor's own surface is empty; warmer accent + a next-step hint. */
export const Gated: Story = {
  args: {
    variant: 'gated',
    emoji: '🪺',
    title: '첫 번째 드롭을 올려보세요',
    description: '프롬프트나 스킬을 공유하고, 다른 메이커들이 활용할 수 있게 만들어보세요.',
    hint: '검증된 프롬프트·CLAUDE.md·스킬 무엇이든 좋아요. 첫 드롭은 보통 몇 분이면 올려요.',
    action: (
      <button
        type="button"
        className="inline-flex items-center rounded-full bg-volt-500 px-4 py-2 text-sm font-semibold text-ink"
      >
        첫 드롭 올리기
      </button>
    ),
  },
}
