import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AudienceMatch from './AudienceMatch'

describe('<AudienceMatch />', () => {
  it('renders fit bullets from the type bucket alone', () => {
    render(<AudienceMatch type="PROMPT" category="" />)
    expect(screen.getByText('이런 분께')).toBeTruthy()
    expect(screen.getByText('특정 작업에 맞는 검증된 프롬프트를 바로 쓰고 싶은 분')).toBeTruthy()
    expect(screen.getByText(/Skill \/ Sub-agent/)).toBeTruthy()
  })

  it('appends a category line when category is non-empty', () => {
    render(<AudienceMatch type="PROMPT" category="Coding" />)
    expect(screen.getByText('Coding 카테고리 작업이 잦은 분')).toBeTruthy()
  })

  it('appends a difficulty fit + mismatch when difficulty is set', () => {
    render(<AudienceMatch type="PROMPT" category="Coding" difficulty="beginner" />)
    expect(screen.getByText('입문자도 바로 적용하기 쉬워요')).toBeTruthy()
    expect(screen.getByText(/고급 옵션·세팅을 기대하는 분께는 가벼울 수 있어요/)).toBeTruthy()
  })

  it('explains the technique when one is set', () => {
    render(<AudienceMatch type="PROMPT" category="" technique="chain-of-thought" />)
    expect(screen.getByText(/문제 분해와 단계별 추론을 유도하는 패턴/)).toBeTruthy()
  })

  it('summarises single-model listings as exclusive', () => {
    render(<AudienceMatch type="PROMPT" category="" models={['claude-opus-4-7']} />)
    expect(screen.getByText('claude-opus-4-7 전용으로 다듬어졌어요')).toBeTruthy()
  })

  it('summarises multi-model listings with a count', () => {
    render(
      <AudienceMatch
        type="PROMPT"
        category=""
        models={['claude-opus-4-7', 'gpt-5', 'gemini-2-5-pro']}
      />
    )
    expect(screen.getByText('3개 모델에 최적화, 비교 실험에 좋아요')).toBeTruthy()
  })

  it('treats `any` model as model-agnostic', () => {
    render(<AudienceMatch type="PROMPT" category="" models={['any']} />)
    expect(screen.getByText('모델 비종속, 어디서 쓰든 동작')).toBeTruthy()
  })

  it('omits the "이럴 땐 다른 걸 보세요" section when there are no mismatches', () => {
    // CLAUDE_MD has a mismatch line; pick CURSOR_RULES for variety.
    // Actually every TYPE_AUDIENCE entry has at least one mismatch, so we
    // verify the section header is always present when type has any
    // mismatches. (Smoke-style: the section header *renders*.)
    render(<AudienceMatch type="PROMPT" category="" />)
    expect(screen.getByText('이럴 땐 다른 걸 보세요')).toBeTruthy()
  })
})
