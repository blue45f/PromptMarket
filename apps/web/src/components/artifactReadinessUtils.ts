const VARIABLE_PATTERN = /\{\{\s*([A-Za-z][\w.-]{0,48})\s*\}\}/g

export function extractTemplateVariables(source?: string | null): string[] {
  if (!source) return []

  const variables: string[] = []
  const seen = new Set<string>()

  for (const match of source.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]
    if (!name || seen.has(name)) continue
    seen.add(name)
    variables.push(name)
  }

  return variables
}
