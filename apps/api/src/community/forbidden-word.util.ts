export interface ForbiddenWordMatcherRule {
  normalizedPhrase: string
  matchType: string
}

export function normalizeForbiddenPhrase(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function matchesForbiddenWord(text: string, rule: ForbiddenWordMatcherRule): boolean {
  const phrase = rule.normalizedPhrase
  if (!phrase) return false

  const normalizedText = normalizeForbiddenPhrase(text)
  if (rule.matchType === 'CONTAINS') return normalizedText.includes(phrase)

  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, 'u').test(
    normalizedText
  )
}
