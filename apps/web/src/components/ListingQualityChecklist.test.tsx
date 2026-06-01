import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ListingQualityChecklist, { evaluateListingQuality } from './ListingQualityChecklist'

describe('evaluateListingQuality', () => {
  it('marks a listing ready when use case, body, inputs, and metadata are strong', () => {
    const result = evaluateListingQuality({
      title: 'Production API Review Prompt',
      description: 'Reviews FastAPI pull requests for security, latency, and database regressions.',
      body: `# Review prompt

Use this for {{service_name}} and inspect routing, auth, migrations, logs, and error handling.
Return risk-ranked findings with file references and fix notes.`,
      type: 'PROMPT',
      tags: 'fastapi, review, security',
      models: ['claude-opus-4-7', 'gpt-5'],
      version: '1.2.0',
    })

    expect(result.complete).toBe(4)
    expect(result.items.every((item) => item.passed)).toBe(true)
    expect(result.variables).toEqual(['service_name'])
  })

  it('flags weak listings with missing body depth, inputs, and metadata', () => {
    const result = evaluateListingQuality({
      title: 'Prompt',
      description: 'Short.',
      body: 'Do it.',
      type: 'PROMPT',
      tags: '',
      models: [],
      version: 'draft',
    })

    expect(result.complete).toBe(0)
    expect(result.items.map((item) => item.key)).toEqual([
      'useCase',
      'bodyDepth',
      'inputs',
      'metadata',
    ])
  })

  it('accepts setup hints for non-prompt listings as valid inputs', () => {
    const result = evaluateListingQuality({
      title: 'MCP deployment checklist',
      description:
        'Reusable deployment notes with required API settings and environment configuration for a reliable MCP server rollout.',
      body: `Use this with API_KEY and TOKEN to initialize the server. Include header settings, env var validation, and rollout notes for retries, backoff, and failure recovery before every deployment.\n\nTrack service health, restart behavior, and response latency across environments.`,
      type: 'MCP_SERVER',
      tags: 'mcp, ops',
      models: ['claude-code'],
      version: '0.1.0',
    })

    const inputs = result.items.find((item) => item.key === 'inputs')
    const metadata = result.items.find((item) => item.key === 'metadata')
    expect(inputs?.passed).toBe(true)
    expect(metadata?.passed).toBe(true)
    expect(result.complete).toBe(4)
  })

  it('keeps metadata strict on semver and tag thresholds', () => {
    const weak = evaluateListingQuality({
      title: 'MCP deployment checklist',
      description:
        'Reusable deployment notes with required API settings and environment configuration.',
      body: `Use this with API_KEY and TOKEN to initialize the server. Include header settings, env var validation, and rollout notes for retries, backoff, and failure recovery before every deployment.\n\nTrack service health, restart behavior, and response latency across environments.`,
      type: 'MCP_SERVER',
      tags: 'mcp',
      models: ['claude-code'],
      version: '1.2',
    })

    const metadata = weak.items.find((item) => item.key === 'metadata')
    expect(metadata?.passed).toBe(false)
    expect(weak.complete).toBe(3)
  })
})

describe('<ListingQualityChecklist />', () => {
  it('renders a seller-facing quality checklist with score and variables', () => {
    render(
      <ListingQualityChecklist
        title="Production API Review Prompt"
        description="Reviews FastAPI pull requests for security, latency, and database regressions."
        body="Use this for {{service_name}} and inspect routing, auth, migrations, logs, and error handling. Return risk-ranked findings with file references and fix notes."
        type="PROMPT"
        tags="fastapi, review, security"
        models={['claude-opus-4-7', 'gpt-5']}
        version="1.2.0"
      />
    )

    expect(screen.getByRole('heading', { name: '게시 품질 체크' })).toBeTruthy()
    expect(screen.getByText('4/4')).toBeTruthy()
    expect(screen.getByText('사용 사례')).toBeTruthy()
    expect(screen.getByText('입력 변수')).toBeTruthy()
    expect(screen.getByText('검색/배포 정보')).toBeTruthy()
    expect(screen.getByText('service_name')).toBeTruthy()
  })
})
