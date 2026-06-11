/**
 * Minimal parser for TermsDesk policy bodies.
 *
 * A body can be markdown-ish or Korean statute-style plain text
 * (`제N조 (제목)` headings + paragraphs + `- ` bullets). The published
 * documents use single newlines inside a section, so a generic markdown
 * renderer would collapse the article heading into its paragraph. This
 * parser only splits the string into block structure and renders it as
 * React elements — no HTML injection, no inline markup handling.
 */

export type PolicyHeadingLevel = 2 | 3 | 4 | 5 | 6

export interface PolicyHeadingBlock {
  kind: 'heading'
  level: PolicyHeadingLevel
  text: string
}

export interface PolicyParagraphBlock {
  kind: 'paragraph'
  text: string
}

export interface PolicyListBlock {
  kind: 'list'
  ordered: boolean
  items: string[]
}

export interface PolicyDividerBlock {
  kind: 'divider'
}

export type PolicyBlock =
  | PolicyHeadingBlock
  | PolicyParagraphBlock
  | PolicyListBlock
  | PolicyDividerBlock

const MD_HEADING_RE = /^(#{1,6})\s+(.+)$/
const DIVIDER_RE = /^(?:-{3,}|\*{3,}|_{3,})$/
const BULLET_RE = /^[-*+]\s+(.+)$/
const ORDERED_RE = /^\d{1,3}[.)]\s+(.+)$/
const ARTICLE_PREFIX_RE = /^제\d{1,4}조/

/** A line that is only a statute heading: `제1조` or `제1조 (목적)`. */
function isArticleHeadingLine(line: string): boolean {
  const article = ARTICLE_PREFIX_RE.exec(line)
  if (!article) return false
  const rest = line.slice(article[0].length).trim()
  if (rest === '') return true
  return rest.startsWith('(') && rest.endsWith(')')
}

/** Markdown headings sit under the page h1 (document name), so demote one level. */
function demoteHeadingLevel(hashCount: number): PolicyHeadingLevel {
  const level = Math.min(hashCount + 1, 6)
  return level as PolicyHeadingLevel
}

export function parsePolicyBody(body: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = []
  let paragraphLines: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraphLines.join('\n') })
      paragraphLines = []
    }
  }

  const flushList = () => {
    if (list) {
      blocks.push({ kind: 'list', ordered: list.ordered, items: list.items })
      list = null
    }
  }

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (line === '') {
      flushParagraph()
      flushList()
      continue
    }

    const mdHeading = MD_HEADING_RE.exec(line)
    if (mdHeading) {
      flushParagraph()
      flushList()
      blocks.push({
        kind: 'heading',
        level: demoteHeadingLevel(mdHeading[1].length),
        text: mdHeading[2].trim(),
      })
      continue
    }

    if (DIVIDER_RE.test(line)) {
      flushParagraph()
      flushList()
      blocks.push({ kind: 'divider' })
      continue
    }

    const bullet = BULLET_RE.exec(line)
    if (bullet) {
      flushParagraph()
      if (list?.ordered) flushList()
      list ??= { ordered: false, items: [] }
      list.items.push(bullet[1].trim())
      continue
    }

    const ordered = ORDERED_RE.exec(line)
    if (ordered) {
      flushParagraph()
      if (list && !list.ordered) flushList()
      list ??= { ordered: true, items: [] }
      list.items.push(ordered[1].trim())
      continue
    }

    // Statute headings are only promoted when they start a block; a `제N조…`
    // reference inside a running paragraph stays body text.
    if (paragraphLines.length === 0 && isArticleHeadingLine(line)) {
      flushList()
      blocks.push({ kind: 'heading', level: 2, text: line })
      continue
    }

    flushList()
    paragraphLines.push(line)
  }

  flushParagraph()
  flushList()

  return blocks
}
