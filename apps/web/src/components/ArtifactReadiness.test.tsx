import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArtifactReadiness, { extractTemplateVariables } from './ArtifactReadiness'

describe('extractTemplateVariables', () => {
  it('dedupes double-brace template variables in reading order', () => {
    expect(
      extractTemplateVariables('Write for {{ audience }} in a {{tone}} tone. Repeat {{audience}}.')
    ).toEqual(['audience', 'tone'])
  })

  it('ignores single braces and unsafe placeholders', () => {
    expect(extractTemplateVariables('JSON: {"name": "Ada"} and {{valid_name}}')).toEqual([
      'valid_name',
    ])
  })
})

describe('<ArtifactReadiness />', () => {
  it('shows run readiness, target, variables, and preview/full access state', () => {
    render(
      <ArtifactReadiness
        type="PROMPT"
        models={['claude-opus-4-7', 'gpt-5']}
        canViewBody={false}
        previewBody="Draft a launch plan for {{audience}} with a {{tone}} tone."
      />
    )

    expect(screen.getByRole('heading', { name: '실행 준비도' })).toBeTruthy()
    expect(screen.getByText('프롬프트 복사')).toBeTruthy()
    expect(screen.getByText('audience')).toBeTruthy()
    expect(screen.getByText('tone')).toBeTruthy()
    expect(screen.getByText('미리보기 기준')).toBeTruthy()
    expect(screen.getByText('2개 모델')).toBeTruthy()
  })

  it('shows an explicit no-variable state when no slots are detected', () => {
    render(<ArtifactReadiness type="MCP_SERVER" canViewBody body="No slots here." />)

    expect(screen.getByText('추가 입력 없음')).toBeTruthy()
    expect(screen.getByText('MCP 설정')).toBeTruthy()
  })
})
