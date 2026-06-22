import data from '../sample-data.json'

// 도메인 타입은 packages/shared(일반 서비스와 동일 소스) 재사용 — 재선언 금지.
import type { ListingFull } from '@shared/index'

export type Listing = ListingFull
const items: Listing[] = (data as { items?: Listing[] }).items || []
export function getListings(): Listing[] {
  return items
}
export function getListing(id: string): Listing | undefined {
  return items.find((l) => String(l.id) === id || l.slug === id)
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
