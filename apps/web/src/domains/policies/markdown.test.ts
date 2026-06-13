import { describe, expect, it } from 'vitest'

import { parsePolicyBody } from './markdown'

describe('parsePolicyBody', () => {
  it('promotes standalone Korean article lines to headings at block start', () => {
    const body =
      '제1조 (목적)\n이 약관은 이용 조건을 정합니다.\n\n제2조 (범위)\n서비스 범위를 정합니다.'

    expect(parsePolicyBody(body)).toEqual([
      { kind: 'heading', level: 2, text: '제1조 (목적)' },
      { kind: 'paragraph', text: '이 약관은 이용 조건을 정합니다.' },
      { kind: 'heading', level: 2, text: '제2조 (범위)' },
      { kind: 'paragraph', text: '서비스 범위를 정합니다.' },
    ])
  })

  it('keeps article references inside a running paragraph as plain text', () => {
    const body = '본 약관은\n제3조에 따라 처리됩니다.'

    expect(parsePolicyBody(body)).toEqual([
      { kind: 'paragraph', text: '본 약관은\n제3조에 따라 처리됩니다.' },
    ])
  })

  it('groups consecutive bullet lines into one unordered list', () => {
    const body = '제2조 (처리 항목)\n다음 정보를 처리합니다.\n- 계정 정보\n- 이용 정보\n\n다음 문단'

    expect(parsePolicyBody(body)).toEqual([
      { kind: 'heading', level: 2, text: '제2조 (처리 항목)' },
      { kind: 'paragraph', text: '다음 정보를 처리합니다.' },
      { kind: 'list', ordered: false, items: ['계정 정보', '이용 정보'] },
      { kind: 'paragraph', text: '다음 문단' },
    ])
  })

  it('parses numbered lines into an ordered list', () => {
    expect(parsePolicyBody('1. 첫째\n2. 둘째')).toEqual([
      { kind: 'list', ordered: true, items: ['첫째', '둘째'] },
    ])
  })

  it('splits adjacent lists when the marker style changes', () => {
    expect(parsePolicyBody('- 불릿\n1. 번호')).toEqual([
      { kind: 'list', ordered: false, items: ['불릿'] },
      { kind: 'list', ordered: true, items: ['번호'] },
    ])
  })

  it('demotes markdown headings one level below the page title', () => {
    expect(parsePolicyBody('# 최상위\n\n## 하위\n\n###### 최하위')).toEqual([
      { kind: 'heading', level: 2, text: '최상위' },
      { kind: 'heading', level: 3, text: '하위' },
      { kind: 'heading', level: 6, text: '최하위' },
    ])
  })

  it('renders thematic breaks as dividers', () => {
    expect(parsePolicyBody('위 문단\n\n---\n\n아래 문단')).toEqual([
      { kind: 'paragraph', text: '위 문단' },
      { kind: 'divider' },
      { kind: 'paragraph', text: '아래 문단' },
    ])
  })

  it('joins consecutive plain lines into a single paragraph and trims blank edges', () => {
    expect(parsePolicyBody('\n첫 줄\n둘째 줄\n\n')).toEqual([
      { kind: 'paragraph', text: '첫 줄\n둘째 줄' },
    ])
  })

  it('returns no blocks for an empty body', () => {
    expect(parsePolicyBody('')).toEqual([])
    expect(parsePolicyBody('\n\n')).toEqual([])
  })
})
