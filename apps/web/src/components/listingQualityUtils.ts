import type { ListingType } from '@promptmarket/shared'
import { extractTemplateVariables } from './artifactReadinessUtils'

export interface ListingQualityInput {
  title?: string | null
  description?: string | null
  body?: string | null
  type: ListingType
  tags?: string | string[] | null
  models?: string[] | null
  version?: string | null
}

export type QualityKey = 'useCase' | 'bodyDepth' | 'inputs' | 'metadata'
export type ListingSection = 'basics' | 'content' | 'metadata'

export interface QualityItem {
  key: QualityKey
  passed: boolean
}

export interface ListingQualityResult {
  complete: number
  total: number
  items: QualityItem[]
  variables: string[]
  tagCount: number
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/
const CONFIG_PATTERN = /\b(api|token|key|env|config|secret|header|query|설정|환경|토큰|키)\b/i

export const TARGET_SECTION_BY_QUALITY: Record<QualityKey, ListingSection> = {
  useCase: 'basics',
  bodyDepth: 'content',
  inputs: 'content',
  metadata: 'metadata',
}

export function evaluateListingQuality(input: ListingQualityInput): ListingQualityResult {
  const title = input.title?.trim() ?? ''
  const description = input.description?.trim() ?? ''
  const body = input.body?.trim() ?? ''
  const variables = extractTemplateVariables(body)
  const tagCount = normalizeTags(input.tags).length
  const models = input.models?.filter(Boolean) ?? []
  const version = input.version?.trim() ?? ''

  const useCase = title.length >= 12 && description.length >= 40
  const bodyDepth = body.length >= 120
  const inputs =
    input.type === 'PROMPT'
      ? variables.length > 0
      : variables.length > 0 || CONFIG_PATTERN.test(body)
  const metadata = models.length > 0 && tagCount >= 2 && SEMVER_PATTERN.test(version)

  const items: QualityItem[] = [
    { key: 'useCase', passed: useCase },
    { key: 'bodyDepth', passed: bodyDepth },
    { key: 'inputs', passed: inputs },
    { key: 'metadata', passed: metadata },
  ]

  return {
    complete: items.filter((item) => item.passed).length,
    total: items.length,
    items,
    variables,
    tagCount,
  }
}

function normalizeTags(tags: ListingQualityInput['tags']): string[] {
  if (Array.isArray(tags)) return tags.map((tag) => tag.trim()).filter(Boolean)
  return (tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}
