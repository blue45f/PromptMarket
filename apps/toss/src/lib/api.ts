import data from '../sample-data.json'

// 도메인 타입은 packages/shared(일반 서비스와 동일 소스) 재사용 — 재선언 금지.
import type { ListingFull } from '@shared/index'

export type Listing = ListingFull
const fallbackItems: Listing[] = (data as { items?: Listing[] }).items || []

export async function getListings(): Promise<Listing[]> {
  try {
    const res = await fetch('/api/listings?pageSize=48')
    if (!res.ok) throw new Error('Failed to fetch listings')
    const json = await res.json()
    return json.items || fallbackItems
  } catch (error) {
    console.error('Failed to fetch listings from API, falling back to local JSON:', error)
    return fallbackItems
  }
}

export async function getListing(id: string): Promise<Listing | undefined> {
  try {
    const res = await fetch(`/api/listings/${id}`)
    if (!res.ok) {
      if (res.status === 404) return undefined
      throw new Error('Failed to fetch listing')
    }
    return await res.json()
  } catch (error) {
    console.error(`Failed to fetch listing ${id} from API, falling back to local JSON:`, error)
    return fallbackItems.find((l) => String(l.id) === id || l.slug === id)
  }
}

export const TYPE_LABEL: Record<string, string> = {
  PROMPT: '프롬프트',
  CLAUDE_MD: 'CLAUDE.md',
  AGENT_MD: 'AGENT.md',
  SKILL: '스킬',
  MCP_SERVER: 'MCP 서버',
  SLASH_COMMAND: '슬래시 명령',
  SUBAGENT: '서브에이전트',
  CURSOR_RULES: 'Cursor 룰',
}
export const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
}
export const price = (cents: number) => '$' + (cents / 100).toFixed(2)
